import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios from 'axios';

import { onboardingConfig } from '../config/onboarding.config';
import { AuthService } from '../onboarding/auth.service';
import { UsersRepository } from '../onboarding/users.repository';
import { ArgoCdClient } from '../pipelines/services/argo-cd.client';
import { GithubAppService } from './github-app.service';
import {
  renderManifestFiles,
  renderUserRepoFiles,
  sanitizeName,
} from './templates';

export interface RepoSummary {
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  defaultBranch: string;
  htmlUrl: string;
  updatedAt: string;
  isFork: boolean;
  isPrivate: boolean;
}

export type StackPreview =
  | { stack: 'nextjs'; packageName: string | null; port: number; nodeEngine: string | null }
  | { stack: 'unsupported'; reason: string };

interface GithubRepo {
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  default_branch: string;
  html_url: string;
  updated_at: string;
  fork: boolean;
  private: boolean;
}

interface GithubContent {
  content: string;
  encoding: 'base64' | string;
}

export interface RegisterRequest {
  fullName: string; // "owner/repo"
}

export interface RegisterResponse {
  ok: true;
  fullName: string;
  subdomain: string;
  liveUrl: string;
  userRepoCommit: string;
  manifestRepoCommit: string;
}

export type StageStatus = 'pending' | 'running' | 'success' | 'failed';

export interface StageInfo {
  status: StageStatus;
  message: string;
  link?: string;
}

export interface CurrentDeployment {
  login: string;
  repo: string;
  fullName: string;
  appName: string;
  liveUrl: string;
  syncStatus: string | null;
  healthStatus: string | null;
}

export interface DeploymentStatus {
  login: string;
  repo: string;
  appName: string;
  liveUrl: string;
  stages: {
    manifests: StageInfo;
    build: StageInfo;
    imageDetected: StageInfo;
    deploy: StageInfo;
    live: StageInfo;
  };
}

interface GhaRunSummary {
  id: number;
  status: string;
  conclusion: string | null;
  html_url: string;
  head_sha: string;
  created_at: string;
}

@Injectable()
export class DeployService {
  private readonly logger = new Logger(DeployService.name);

  constructor(
    private readonly auth: AuthService,
    private readonly githubApp: GithubAppService,
    private readonly users: UsersRepository,
    private readonly argo: ArgoCdClient,
    @Inject(onboardingConfig.KEY)
    private readonly config: ConfigType<typeof onboardingConfig>
  ) {}

  async listRepos(userId: number): Promise<RepoSummary[]> {
    const accessToken = await this.auth.getValidAccessToken(userId);
    const resp = await axios.get<GithubRepo[]>('https://api.github.com/user/repos', {
      params: {
        affiliation: 'owner',
        sort: 'updated',
        direction: 'desc',
        per_page: 30,
      },
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    });
    return resp.data.map((r) => ({
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      language: r.language,
      defaultBranch: r.default_branch,
      htmlUrl: r.html_url,
      updatedAt: r.updated_at,
      isFork: r.fork,
      isPrivate: r.private,
    }));
  }

  async detectStack(userId: number, owner: string, repo: string): Promise<StackPreview> {
    const accessToken = await this.auth.getValidAccessToken(userId);

    let pkg: { name?: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string>; engines?: { node?: string } };
    try {
      const resp = await axios.get<GithubContent>(
        `https://api.github.com/repos/${owner}/${repo}/contents/package.json`,
        {
          headers: {
            Authorization: `token ${accessToken}`,
            Accept: 'application/vnd.github+json',
          },
        }
      );
      const content = Buffer.from(resp.data.content, 'base64').toString('utf8');
      pkg = JSON.parse(content);
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 404) {
        return { stack: 'unsupported', reason: 'package.json not found in repo root' };
      }
      this.logger.warn(`detectStack failed for ${owner}/${repo}: ${(err as Error).message}`);
      return { stack: 'unsupported', reason: 'package.json could not be read' };
    }

    const hasNext = Boolean(
      pkg.dependencies?.['next'] ?? pkg.devDependencies?.['next']
    );
    if (!hasNext) {
      return {
        stack: 'unsupported',
        reason: 'No Next.js dependency detected (v0 supports Next.js only)',
      };
    }

    return {
      stack: 'nextjs',
      packageName: pkg.name ?? null,
      port: 3000,
      nodeEngine: pkg.engines?.node ?? null,
    };
  }

  /** Allowlist-gated full registration: renders user-repo files (Dockerfile +
   * workflow), commits them to the user's repo, then renders manifests and
   * commits them to the manifest repo. ApplicationSet picks up the new
   * metadata.yaml and deploys automatically.
   *
   * Re-running for the same user replaces their existing deploy/users/<login>/
   * directory atomically (orphan files in old app subdirs are deleted in the
   * same commit). Phase 1 caps one app per user. */
  async registerForUser(userLogin: string, req: RegisterRequest): Promise<RegisterResponse> {
    // GitHub logins preserve case; allowlist and k8s naming need lowercase.
    const loginLc = userLogin.toLowerCase();
    const allowlistLc = this.config.deployAllowlist.map((s) => s.toLowerCase());
    if (!allowlistLc.includes(loginLc)) {
      this.users.audit({
        actor: userLogin,
        action: 'ACCESS_DENIED',
        target: req.fullName,
        reason: 'BETA_ALLOWLIST',
        metaJson: null,
      });
      throw new ForbiddenException({ reason: 'BETA_ALLOWLIST', message: '베타 액세스 권한이 없습니다.' });
    }

    const [owner, repo] = req.fullName.split('/');
    if (!owner || !repo) {
      throw new ForbiddenException({ reason: 'INVALID_REPO', message: 'invalid fullName' });
    }

    const user = this.users.findByLogin(userLogin);
    if (!user) {
      throw new ForbiddenException({ reason: 'NO_USER', message: 'user record missing' });
    }

    // Re-detect stack to make sure preview wasn't stale.
    const preview = await this.detectStack(user.id, owner, repo);
    if (preview.stack !== 'nextjs') {
      this.users.audit({
        actor: userLogin,
        action: 'ACCESS_DENIED',
        target: req.fullName,
        reason: 'STACK_UNSUPPORTED',
        metaJson: JSON.stringify(preview),
      });
      throw new ForbiddenException({ reason: 'STACK_UNSUPPORTED', message: preview.reason });
    }

    const appName = sanitizeName(repo);
    const subdomain = sanitizeName(`${loginLc}-${appName}`, 53);
    const params = {
      login: loginLc,
      appName,
      imageRepo: `ghcr.io/${loginLc}/${repo.toLowerCase()}`,
      subdomain,
      port: preview.port,
      uid: 1000,
    };

    const userRepoFiles = renderUserRepoFiles(params);
    const manifestFiles = renderManifestFiles(params);

    // Commit to user repo (creates/updates Dockerfile + workflow).
    let userRepoCommit: string;
    try {
      const userRepoToken = await this.githubApp.getInstallationTokenForRepo(owner, repo);
      userRepoCommit = await this.githubApp.commitFilesAtomic({
        owner,
        repo,
        branch: 'main',
        files: userRepoFiles,
        message: `chore: swkoo.kr auto-deploy setup (Dockerfile + workflow)\n\nGenerated by https://swkoo.kr/deploy`,
        token: userRepoToken,
      });
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.startsWith('INSTALLATION_NOT_FOUND')) {
        throw new ForbiddenException({
          reason: 'APP_NOT_INSTALLED_ON_USER_REPO',
          message: `swkoo-deploy GitHub App이 ${owner}/${repo} 에 설치되어 있지 않습니다. https://github.com/apps/swkoo-deploy/installations/new 에서 설치하고 다시 시도해주세요.`,
        });
      }
      throw err;
    }

    // Commit manifests to swkoo-portfolio.
    const [manifestOwner, manifestRepo] = this.config.manifestRepo.split('/');
    let manifestRepoCommit: string;
    try {
      const manifestToken = await this.githubApp.getInstallationTokenForRepo(
        manifestOwner,
        manifestRepo
      );
      manifestRepoCommit = await this.githubApp.commitFilesAtomic({
        owner: manifestOwner,
        repo: manifestRepo,
        branch: this.config.manifestBranch,
        files: manifestFiles,
        message: `feat(deploy): register ${loginLc}/${appName} via swkoo.kr/deploy\n\nUser: ${userLogin}\nApp: ${appName}\nImage: ${params.imageRepo}:latest\nURL: https://${subdomain}.${this.config.appsDomain}`,
        token: manifestToken,
        replaceDirPath: `deploy/users/${loginLc}`,
      });
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.startsWith('INSTALLATION_NOT_FOUND')) {
        throw new ForbiddenException({
          reason: 'APP_NOT_INSTALLED_ON_MANIFEST_REPO',
          message: `swkoo-deploy GitHub App이 ${this.config.manifestRepo} 에 설치되어 있지 않습니다. 운영자에게 알려주세요.`,
        });
      }
      throw err;
    }

    this.users.audit({
      actor: userLogin,
      action: 'DEPLOY_REGISTER',
      target: req.fullName,
      reason: null,
      metaJson: JSON.stringify({
        subdomain,
        appName,
        userRepoCommit,
        manifestRepoCommit,
      }),
    });

    return {
      ok: true,
      fullName: req.fullName,
      subdomain,
      liveUrl: `https://${subdomain}.${this.config.appsDomain}`,
      userRepoCommit,
      manifestRepoCommit,
    };
  }

  /** Returns the user's currently-registered deployment, if any. Reads
   * the ArgoCD Application named `swkoo-user-<login>` and parses the
   * image-list annotation for the source repo. Null when the user has
   * no deployment. */
  async getCurrentDeployment(login: string): Promise<CurrentDeployment | null> {
    const loginLc = login.toLowerCase();
    const app = await this.argo.getApplication(`swkoo-user-${loginLc}`).catch(() => null);
    if (!app) return null;
    const annotations = app.metadata?.annotations ?? {};
    const imageList = annotations['argocd-image-updater.argoproj.io/image-list'];
    if (!imageList) return null;
    // Format: "app=ghcr.io/<login>/<repo>:latest"
    const match = imageList.match(/=ghcr\.io\/([^/]+)\/([^:]+)/);
    if (!match) return null;
    const repo = match[2];
    const appName = sanitizeName(repo);
    const subdomain = sanitizeName(`${loginLc}-${appName}`, 53);
    return {
      login: loginLc,
      repo,
      fullName: `${loginLc}/${repo}`,
      appName,
      liveUrl: `https://${subdomain}.${this.config.appsDomain}`,
      syncStatus: app.status?.sync?.status ?? null,
      healthStatus: app.status?.health?.status ?? null,
    };
  }

  /** Atomic removal of the user's deploy/users/<login>/ directory in
   * the manifest repo. ApplicationSet auto-prunes the matching Application
   * on its next refresh (~3 min), cascading to namespace deletion. The
   * user's source repo (Dockerfile + workflow + GHCR images) is untouched. */
  async deleteDeployment(userLogin: string): Promise<{ commit: string }> {
    const loginLc = userLogin.toLowerCase();
    const allowlistLc = this.config.deployAllowlist.map((s) => s.toLowerCase());
    if (!allowlistLc.includes(loginLc)) {
      throw new ForbiddenException({ reason: 'BETA_ALLOWLIST', message: '베타 액세스 권한이 없습니다.' });
    }
    const [owner, repo] = this.config.manifestRepo.split('/');
    let commit: string;
    try {
      const token = await this.githubApp.getInstallationTokenForRepo(owner, repo);
      commit = await this.githubApp.commitFilesAtomic({
        owner,
        repo,
        branch: this.config.manifestBranch,
        files: {},
        message: `feat(deploy): unregister ${loginLc} via swkoo.kr/deploy\n\nUser-initiated removal.`,
        token,
        replaceDirPath: `deploy/users/${loginLc}`,
      });
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'NOTHING_TO_COMMIT') {
        this.users.audit({
          actor: userLogin,
          action: 'DEPLOY_UNREGISTER',
          target: null,
          reason: 'NO_EXISTING_DEPLOYMENT',
          metaJson: null,
        });
        throw new ForbiddenException({
          reason: 'NO_EXISTING_DEPLOYMENT',
          message: '제거할 배포가 없습니다.',
        });
      }
      throw err;
    }

    this.users.audit({
      actor: userLogin,
      action: 'DEPLOY_UNREGISTER',
      target: null,
      reason: null,
      metaJson: JSON.stringify({ commit }),
    });
    return { commit };
  }

  /** Aggregated status for the progress page. Each stage is computed
   * independently and probes its own source (GitHub Actions, ArgoCD,
   * the live URL). Polled by the frontend every few seconds. */
  async getDeploymentStatus(
    requestingUserId: number,
    login: string,
    repo: string
  ): Promise<DeploymentStatus> {
    const loginLc = login.toLowerCase();
    const appName = sanitizeName(repo);
    const subdomain = sanitizeName(`${loginLc}-${appName}`, 53);
    const liveUrl = `https://${subdomain}.${this.config.appsDomain}`;

    const [manifestsStage, buildStage, app, liveStage] = await Promise.all([
      this.checkManifestStage(loginLc),
      this.checkBuildStage(requestingUserId, login, repo),
      this.argo.getApplication(`swkoo-user-${loginLc}`).catch(() => null),
      this.checkLiveStage(liveUrl),
    ]);

    const imageDetectedStage = this.checkImageDetectedStage(app);
    const deployStage = this.checkDeployStage(app);

    return {
      login: loginLc,
      repo,
      appName,
      liveUrl,
      stages: {
        manifests: manifestsStage,
        build: buildStage,
        imageDetected: imageDetectedStage,
        deploy: deployStage,
        live: liveStage,
      },
    };
  }

  private async checkManifestStage(login: string): Promise<StageInfo> {
    const [owner, name] = this.config.manifestRepo.split('/');
    try {
      const token = await this.githubApp.getInstallationTokenForRepo(owner, name);
      await axios.get(
        `https://api.github.com/repos/${owner}/${name}/contents/deploy/users/${login}/metadata.yaml`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github+json',
          },
          params: { ref: this.config.manifestBranch },
        }
      );
      return { status: 'success', message: '매니페스트 등록 완료' };
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 404) {
        return { status: 'pending', message: '매니페스트 등록 대기 중' };
      }
      return { status: 'pending', message: '매니페스트 상태 확인 중' };
    }
  }

  private async checkBuildStage(
    userId: number,
    owner: string,
    repo: string
  ): Promise<StageInfo> {
    let accessToken: string;
    try {
      accessToken = await this.auth.getValidAccessToken(userId);
    } catch {
      return { status: 'pending', message: '빌드 상태 확인 권한 없음 (재로그인 필요)' };
    }
    try {
      const resp = await axios.get<{ workflow_runs: GhaRunSummary[] }>(
        `https://api.github.com/repos/${owner}/${repo}/actions/runs`,
        {
          headers: {
            Authorization: `token ${accessToken}`,
            Accept: 'application/vnd.github+json',
          },
          params: { branch: 'main', per_page: 1 },
        }
      );
      const run = resp.data.workflow_runs[0];
      if (!run) {
        return { status: 'pending', message: '빌드 대기 중 (워크플로 실행 기록 없음)' };
      }
      if (run.status === 'completed' && run.conclusion === 'success') {
        return {
          status: 'success',
          message: `빌드 완료 (${run.head_sha.slice(0, 7)})`,
          link: run.html_url,
        };
      }
      if (run.status === 'completed') {
        return {
          status: 'failed',
          message: `빌드 실패: ${run.conclusion ?? 'unknown'}`,
          link: run.html_url,
        };
      }
      return { status: 'running', message: `이미지 빌드 중 (${run.status})`, link: run.html_url };
    } catch (err) {
      this.logger.warn(`checkBuildStage failed: ${(err as Error).message}`);
      return { status: 'pending', message: '빌드 상태 확인 중' };
    }
  }

  private checkImageDetectedStage(app: unknown): StageInfo {
    const imagesField = (app as {
      spec?: { source?: { kustomize?: { images?: string[] } } };
    } | null)?.spec?.source?.kustomize?.images;
    const images = Array.isArray(imagesField) ? imagesField : [];
    const pinned = images.find((entry) => entry.includes('@sha256:'));
    if (pinned) {
      const digest = pinned.split('@sha256:')[1]?.slice(0, 12);
      return { status: 'success', message: `새 이미지 감지 (sha256:${digest}…)` };
    }
    return { status: 'pending', message: '새 이미지 감지 대기 중' };
  }

  private checkDeployStage(app: unknown): StageInfo {
    const a = app as
      | { status?: { sync?: { status?: string }; health?: { status?: string } } }
      | null;
    if (!a) {
      return { status: 'pending', message: 'ArgoCD Application 감지 대기 중' };
    }
    const sync = a.status?.sync?.status;
    const health = a.status?.health?.status;
    if (sync === 'Synced' && health === 'Healthy') {
      return { status: 'success', message: '배포 완료 (Synced / Healthy)' };
    }
    if (health === 'Degraded') {
      return { status: 'failed', message: `배포 실패 (Health=${health})` };
    }
    return {
      status: 'running',
      message: `배포 진행 중 (Sync=${sync ?? '?'} / Health=${health ?? '?'})`,
    };
  }

  private async checkLiveStage(liveUrl: string): Promise<StageInfo> {
    try {
      const resp = await axios.get(liveUrl, {
        timeout: 3000,
        validateStatus: () => true,
        maxRedirects: 3,
      });
      if (resp.status >= 200 && resp.status < 400) {
        return { status: 'success', message: `${liveUrl} 응답 정상`, link: liveUrl };
      }
      return {
        status: 'pending',
        message: `${liveUrl} HTTP ${resp.status}`,
        link: liveUrl,
      };
    } catch {
      return { status: 'pending', message: '라이브 URL 응답 대기 중', link: liveUrl };
    }
  }
}

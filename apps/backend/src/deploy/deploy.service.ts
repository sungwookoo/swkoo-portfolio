import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios from 'axios';

import { onboardingConfig } from '../config/onboarding.config';
import { AuthService } from '../onboarding/auth.service';
import { UsersRepository } from '../onboarding/users.repository';
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

@Injectable()
export class DeployService {
  private readonly logger = new Logger(DeployService.name);

  constructor(
    private readonly auth: AuthService,
    private readonly githubApp: GithubAppService,
    private readonly users: UsersRepository,
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
}

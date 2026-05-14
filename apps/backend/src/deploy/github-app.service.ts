import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios from 'axios';
import { sign as jwtSign } from 'jsonwebtoken';

import { onboardingConfig } from '../config/onboarding.config';

interface InstallationResp {
  id: number;
}

interface InstallationTokenResp {
  token: string;
  expires_at: string;
}

interface GitRefResp {
  object: { sha: string };
}

interface GitCommitResp {
  sha: string;
  tree: { sha: string };
}

interface GitTreeEntry {
  path: string;
  mode: '100644' | '100755' | '040000' | '160000' | '120000';
  type: 'blob' | 'tree' | 'commit';
  sha?: string | null;
}

interface GitTreeResp {
  sha: string;
  tree: Array<{ path: string; mode: string; type: string; sha: string }>;
}

const BOT_AUTHOR = {
  name: 'swkoo.kr deploy bot',
  email: 'bot@swkoo.kr',
};

/**
 * Wraps the GitHub App auth flow: generates the App JWT, exchanges it for an
 * installation token, and exposes higher-level helpers for atomic commits.
 */
@Injectable()
export class GithubAppService {
  private readonly logger = new Logger(GithubAppService.name);

  constructor(
    @Inject(onboardingConfig.KEY)
    private readonly config: ConfigType<typeof onboardingConfig>
  ) {}

  private generateAppJwt(): string {
    if (!this.config.githubAppId || !this.config.githubAppPrivateKey) {
      throw new Error('GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY not configured');
    }
    const now = Math.floor(Date.now() / 1000);
    return jwtSign(
      { iat: now - 60, exp: now + 600, iss: this.config.githubAppId },
      this.config.githubAppPrivateKey,
      { algorithm: 'RS256' }
    );
  }

  private get appAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.generateAppJwt()}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  private installationAuthHeaders(token: string): Record<string, string> {
    return {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  /** Finds the App installation that has access to the given repo and mints
   * a fresh installation token (valid ~1h). Returns INSTALLATION_NOT_FOUND
   * when the App hasn't been installed on that repo. */
  async getInstallationTokenForRepo(owner: string, repo: string): Promise<string> {
    let installationId: number;
    try {
      const resp = await axios.get<InstallationResp>(
        `https://api.github.com/repos/${owner}/${repo}/installation`,
        { headers: this.appAuthHeaders }
      );
      installationId = resp.data.id;
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 404) {
        throw new Error(`INSTALLATION_NOT_FOUND:${owner}/${repo}`);
      }
      throw err;
    }
    const tokenResp = await axios.post<InstallationTokenResp>(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {},
      { headers: this.appAuthHeaders }
    );
    return tokenResp.data.token;
  }

  /** Atomic multi-file commit using the Git Data API. If `replaceDirPath` is
   * set, files under that directory not present in `files` are deleted in the
   * same commit (so re-deploys leave no orphans). Returns the new commit sha. */
  async commitFilesAtomic(args: {
    owner: string;
    repo: string;
    branch: string;
    files: Record<string, string>;
    message: string;
    token: string;
    replaceDirPath?: string;
  }): Promise<string> {
    const { owner, repo, branch, files, message, token, replaceDirPath } = args;
    const headers = this.installationAuthHeaders(token);

    const refResp = await axios.get<GitRefResp>(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      { headers }
    );
    const baseCommitSha = refResp.data.object.sha;

    const baseCommitResp = await axios.get<GitCommitResp>(
      `https://api.github.com/repos/${owner}/${repo}/git/commits/${baseCommitSha}`,
      { headers }
    );
    const baseTreeSha = baseCommitResp.data.tree.sha;

    const newPaths = new Set(Object.keys(files));
    const deletions: GitTreeEntry[] = [];
    if (replaceDirPath) {
      const treeResp = await axios.get<GitTreeResp>(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${baseTreeSha}?recursive=1`,
        { headers }
      );
      for (const entry of treeResp.data.tree) {
        if (
          entry.type === 'blob' &&
          entry.path.startsWith(`${replaceDirPath}/`) &&
          !newPaths.has(entry.path)
        ) {
          deletions.push({
            path: entry.path,
            mode: '100644',
            type: 'blob',
            sha: null,
          });
        }
      }
    }

    const blobEntries: GitTreeEntry[] = [];
    for (const [path, content] of Object.entries(files)) {
      const blobResp = await axios.post<{ sha: string }>(
        `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
        { content: Buffer.from(content, 'utf8').toString('base64'), encoding: 'base64' },
        { headers }
      );
      blobEntries.push({
        path,
        mode: '100644',
        type: 'blob',
        sha: blobResp.data.sha,
      });
    }

    if (deletions.length === 0 && blobEntries.length === 0) {
      throw new Error('NOTHING_TO_COMMIT');
    }

    const newTreeResp = await axios.post<{ sha: string }>(
      `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      { base_tree: baseTreeSha, tree: [...deletions, ...blobEntries] },
      { headers }
    );

    if (newTreeResp.data.sha === baseTreeSha) {
      this.logger.log(
        `no-op commit skipped for ${owner}/${repo}@${branch} (tree unchanged) — ${message}`
      );
      return baseCommitSha;
    }

    const newCommitResp = await axios.post<{ sha: string }>(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      {
        message,
        tree: newTreeResp.data.sha,
        parents: [baseCommitSha],
        author: { ...BOT_AUTHOR, date: new Date().toISOString() },
      },
      { headers }
    );

    await axios.patch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      { sha: newCommitResp.data.sha },
      { headers }
    );

    this.logger.log(
      `committed ${blobEntries.length} files (${deletions.length} deletions) to ${owner}/${repo}@${branch}: ${newCommitResp.data.sha.slice(0, 7)} — ${message}`
    );
    return newCommitResp.data.sha;
  }
}

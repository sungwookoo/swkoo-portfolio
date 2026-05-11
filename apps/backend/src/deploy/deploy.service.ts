import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

import { AuthService } from '../onboarding/auth.service';

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

@Injectable()
export class DeployService {
  private readonly logger = new Logger(DeployService.name);

  constructor(private readonly auth: AuthService) {}

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
}

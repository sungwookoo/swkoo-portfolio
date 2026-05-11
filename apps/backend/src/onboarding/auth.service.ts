import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios from 'axios';
import { sign, verify } from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';

import { onboardingConfig } from '../config/onboarding.config';
import { UserRow, UsersRepository } from './users.repository';

interface GithubTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GithubUserResponse {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

interface GithubEmailResponse {
  email: string;
  primary: boolean;
  verified: boolean;
}

export interface SessionPayload {
  uid: number;
  login: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(onboardingConfig.KEY)
    private readonly config: ConfigType<typeof onboardingConfig>,
    private readonly users: UsersRepository
  ) {}

  generateOauthState(): string {
    return randomBytes(16).toString('hex');
  }

  buildAuthorizeUrl(state: string): string {
    if (!this.config.githubAppClientId) {
      throw new Error('GITHUB_APP_CLIENT_ID not configured');
    }
    const params = new URLSearchParams({
      client_id: this.config.githubAppClientId,
      redirect_uri: `${this.config.appBaseUrl}/api/auth/github/callback`,
      state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForUser(code: string): Promise<UserRow> {
    if (!this.config.githubAppClientId || !this.config.githubAppClientSecret) {
      throw new Error('GITHUB_APP_CLIENT_ID/SECRET not configured');
    }

    const tokenResp = await axios.post<GithubTokenResponse>(
      'https://github.com/login/oauth/access_token',
      {
        client_id: this.config.githubAppClientId,
        client_secret: this.config.githubAppClientSecret,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenResp.data.access_token;
    if (!accessToken) {
      const detail = tokenResp.data.error_description ?? tokenResp.data.error ?? 'unknown';
      throw new Error(`token exchange failed: ${detail}`);
    }

    const [userResp, emailsResp] = await Promise.all([
      axios.get<GithubUserResponse>('https://api.github.com/user', {
        headers: { Authorization: `token ${accessToken}` },
      }),
      axios
        .get<GithubEmailResponse[]>('https://api.github.com/user/emails', {
          headers: { Authorization: `token ${accessToken}` },
        })
        .catch(() => ({ data: [] as GithubEmailResponse[] })),
    ]);

    const gh = userResp.data;
    const primaryEmail =
      emailsResp.data.find((e) => e.primary && e.verified)?.email ?? gh.email ?? null;

    const user = this.users.upsertUser({
      githubId: gh.id,
      githubLogin: gh.login,
      name: gh.name,
      email: primaryEmail,
      avatarUrl: gh.avatar_url,
    });

    this.users.audit({
      actor: gh.login,
      action: 'SIGN_IN',
      target: null,
      reason: null,
      metaJson: JSON.stringify({ githubId: gh.id }),
    });

    return user;
  }

  signSessionToken(user: UserRow): string {
    if (!this.config.jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }
    return sign({ uid: user.id, login: user.githubLogin }, this.config.jwtSecret, {
      expiresIn: '30d',
    });
  }

  verifySessionToken(token: string): SessionPayload | null {
    if (!this.config.jwtSecret) return null;
    try {
      return verify(token, this.config.jwtSecret) as SessionPayload;
    } catch {
      return null;
    }
  }
}

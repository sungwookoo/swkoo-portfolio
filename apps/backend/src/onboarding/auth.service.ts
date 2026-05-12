import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
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
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  error?: string;
  error_description?: string;
}

export const SESSION_COOKIE = 'swkoo_session';
export const OAUTH_STATE_COOKIE = 'swkoo_oauth_state';

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
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(onboardingConfig.KEY)
    private readonly config: ConfigType<typeof onboardingConfig>,
    private readonly users: UsersRepository
  ) {}

  onApplicationBootstrap(): void {
    // Boot-time seed: env DEPLOY_ALLOWLIST → DB is_allowed for existing rows.
    // After this, the /admin UI is the source of truth; env stays as bootstrap.
    //
    // Must run in onApplicationBootstrap (not onModuleInit): NestJS calls
    // onModuleInit in provider-registration order rather than dependency
    // order, so UsersRepository.db may not be initialized yet when
    // AuthService.onModuleInit fires. onApplicationBootstrap is guaranteed
    // to run after every onModuleInit has completed.
    const flipped = this.users.seedAllowlist(this.config.deployAllowlist);
    if (flipped > 0) {
      this.logger.log(`Seeded is_allowed=1 for ${flipped} existing user(s) from DEPLOY_ALLOWLIST`);
    }
  }

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

    // Lazy seed for users not yet in DB at boot time but listed in env.
    if (!user.isAllowed) {
      const lc = user.githubLogin.toLowerCase();
      const envAllowed = this.config.deployAllowlist.some((l) => l.toLowerCase() === lc);
      if (envAllowed) {
        this.users.setAllowed(user.githubLogin, true);
        user.isAllowed = true;
      }
    }

    this.users.saveTokens(user.id, {
      accessToken,
      refreshToken: tokenResp.data.refresh_token ?? null,
      expiresAt: this.computeExpiry(tokenResp.data.expires_in),
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

  /**
   * Returns a non-expired user access token for the given user, refreshing it
   * via GitHub if necessary. Throws if no token is stored (user must re-auth).
   */
  async getValidAccessToken(userId: number): Promise<string> {
    const tokens = this.users.getTokens(userId);
    if (!tokens) {
      throw new Error('REAUTH_REQUIRED');
    }
    const expiresMs = new Date(tokens.expiresAt).getTime();
    // Refresh ~1 minute before actual expiry to avoid races.
    if (expiresMs > Date.now() + 60_000) {
      return tokens.accessToken;
    }
    if (!tokens.refreshToken) {
      throw new Error('REAUTH_REQUIRED');
    }
    const refreshed = await this.refreshAccessToken(tokens.refreshToken);
    this.users.saveTokens(userId, refreshed);
    return refreshed.accessToken;
  }

  private async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string | null;
    expiresAt: string;
  }> {
    if (!this.config.githubAppClientId || !this.config.githubAppClientSecret) {
      throw new Error('GITHUB_APP_CLIENT_ID/SECRET not configured');
    }
    const resp = await axios.post<GithubTokenResponse>(
      'https://github.com/login/oauth/access_token',
      {
        client_id: this.config.githubAppClientId,
        client_secret: this.config.githubAppClientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      },
      { headers: { Accept: 'application/json' } }
    );
    if (!resp.data.access_token) {
      throw new Error('REAUTH_REQUIRED');
    }
    return {
      accessToken: resp.data.access_token,
      refreshToken: resp.data.refresh_token ?? refreshToken,
      expiresAt: this.computeExpiry(resp.data.expires_in),
    };
  }

  private computeExpiry(expiresInSec: number | undefined): string {
    // GitHub Apps with "Expire user authorization tokens" enabled return
    // expires_in (8h default). Without that setting, fall back to a long
    // window so we don't constantly try to refresh.
    const seconds = expiresInSec ?? 8 * 60 * 60;
    return new Date(Date.now() + seconds * 1000).toISOString();
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

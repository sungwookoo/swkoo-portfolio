import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Inject,
  Logger,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import type { Request, Response } from 'express';

import { onboardingConfig } from '../config/onboarding.config';
import { AuthService, OAUTH_STATE_COOKIE, SESSION_COOKIE } from './auth.service';
import { UsersRepository } from './users.repository';

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

function readCookie(req: Request, name: string): string | undefined {
  const value = (req.cookies as Record<string, unknown> | undefined)?.[name];
  return typeof value === 'string' ? value : undefined;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersRepository,
    @Inject(onboardingConfig.KEY)
    private readonly config: ConfigType<typeof onboardingConfig>
  ) {}

  @Get('github/login')
  startOauth(@Res() res: Response): void {
    const state = this.auth.generateOauthState();
    const url = this.auth.buildAuthorizeUrl(state);

    res.cookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: STATE_MAX_AGE_MS,
      path: '/',
    });

    res.redirect(url);
  }

  @Get('github/callback')
  async handleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    const code = typeof req.query.code === 'string' ? req.query.code : undefined;
    const state = typeof req.query.state === 'string' ? req.query.state : undefined;
    const expectedState = readCookie(req, OAUTH_STATE_COOKIE);

    if (!code || !state) {
      throw new BadRequestException('missing code or state');
    }
    if (!expectedState || state !== expectedState) {
      throw new BadRequestException('invalid oauth state');
    }

    res.clearCookie(OAUTH_STATE_COOKIE, { path: '/' });

    try {
      const user = await this.auth.exchangeCodeForUser(code);
      const token = this.auth.signSessionToken(user);
      res.cookie(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE_MS,
        path: '/',
      });
      res.redirect(`${this.config.appBaseUrl}/deploy`);
    } catch (err) {
      this.logger.error(`OAuth callback failed: ${(err as Error).message}`);
      res.redirect(`${this.config.appBaseUrl}/deploy?error=oauth_failed`);
    }
  }

  @Get('me')
  getMe(@Req() req: Request): unknown {
    const token = readCookie(req, SESSION_COOKIE);
    if (!token) {
      throw new UnauthorizedException();
    }
    const payload = this.auth.verifySessionToken(token);
    if (!payload) {
      throw new UnauthorizedException();
    }
    const user = this.users.findById(payload.uid);
    if (!user) {
      throw new UnauthorizedException();
    }
    // requiresReauth = user signed in before token storage existed, or refresh
    // chain broke. Frontend should prompt them to sign in again.
    const requiresReauth = this.users.getTokens(user.id) === null;
    const isAdmin = this.config.adminLogins
      .map((l) => l.toLowerCase())
      .includes(user.githubLogin.toLowerCase());
    return {
      id: user.id,
      githubLogin: user.githubLogin,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      isAllowed: user.isAllowed,
      isAdmin,
      requiresReauth,
      brandName: this.config.brandName,
    };
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res() res: Response): void {
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.send();
  }
}

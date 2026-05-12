import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { onboardingConfig } from '../config/onboarding.config';
import { AuthedRequest } from './jwt-auth.guard';
import { UsersRepository } from './users.repository';

/**
 * Gates /admin/* routes. Must be used together with JwtAuthGuard (which
 * populates req.user); on its own this guard refuses unauthenticated
 * requests with NOT_AUTHENTICATED.
 *
 * Admin set is env-only (ADMIN_LOGINS) and never DB-managed — there is no
 * UI flow to elevate someone to admin. Audit_log records each denied call.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject(onboardingConfig.KEY)
    private readonly config: ConfigType<typeof onboardingConfig>,
    private readonly users: UsersRepository
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException({
        reason: 'NOT_AUTHENTICATED',
        message: 'sign in required',
      });
    }
    const adminsLc = this.config.adminLogins.map((l) => l.toLowerCase());
    if (!adminsLc.includes(user.githubLogin.toLowerCase())) {
      this.users.audit({
        actor: user.githubLogin,
        action: 'ADMIN_DENIED',
        target: req.path,
        reason: 'NOT_ADMIN',
        metaJson: null,
      });
      throw new ForbiddenException({ reason: 'NOT_ADMIN', message: 'admin only' });
    }
    return true;
  }
}

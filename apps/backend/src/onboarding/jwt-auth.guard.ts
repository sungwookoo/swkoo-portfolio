import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import { AuthService, SESSION_COOKIE } from './auth.service';
import { UserRow, UsersRepository } from './users.repository';

export interface AuthedRequest extends Request {
  user: UserRow;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersRepository
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const raw = cookies?.[SESSION_COOKIE];
    const token = typeof raw === 'string' ? raw : undefined;
    if (!token) throw new UnauthorizedException();
    const payload = this.auth.verifySessionToken(token);
    if (!payload) throw new UnauthorizedException();
    const user = this.users.findById(payload.uid);
    if (!user) throw new UnauthorizedException();
    (req as AuthedRequest).user = user;
    return true;
  }
}

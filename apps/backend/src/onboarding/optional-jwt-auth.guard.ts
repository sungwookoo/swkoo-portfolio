import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';

import { AuthService, SESSION_COOKIE } from './auth.service';
import { UsersRepository } from './users.repository';
import type { AuthedRequest } from './jwt-auth.guard';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersRepository
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const raw = cookies?.[SESSION_COOKIE];
    const token = typeof raw === 'string' ? raw : undefined;
    if (!token) return true;
    const payload = this.auth.verifySessionToken(token);
    if (!payload) return true;
    const user = this.users.findById(payload.uid);
    if (!user) return true;
    (req as AuthedRequest).user = user;
    return true;
  }
}

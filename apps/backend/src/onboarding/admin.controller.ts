import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AdminGuard } from './admin.guard';
import { AuthedRequest, JwtAuthGuard } from './jwt-auth.guard';
import { UsersRepository } from './users.repository';

interface AdminUserView {
  githubLogin: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string;
  isAllowed: boolean;
}

interface PatchUserBody {
  isAllowed?: unknown;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly users: UsersRepository) {}

  @Get('users')
  listUsers(): { users: AdminUserView[] } {
    const rows = this.users.listAllUsers();
    return {
      users: rows.map((u) => ({
        githubLogin: u.githubLogin,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        isAllowed: u.isAllowed,
      })),
    };
  }

  @Patch('users/:login')
  patchUser(
    @Param('login') login: string,
    @Body() body: PatchUserBody,
    @Req() req: AuthedRequest
  ): { ok: true; login: string; isAllowed: boolean } {
    if (typeof body?.isAllowed !== 'boolean') {
      throw new BadRequestException({
        reason: 'INVALID_BODY',
        message: 'isAllowed boolean required',
      });
    }
    const updated = this.users.setAllowed(login, body.isAllowed);
    if (!updated) {
      throw new NotFoundException({
        reason: 'USER_NOT_FOUND',
        message: `no user with login ${login}`,
      });
    }
    this.users.audit({
      actor: req.user.githubLogin,
      action: body.isAllowed ? 'ALLOWLIST_GRANT' : 'ALLOWLIST_REVOKE',
      target: login,
      reason: null,
      metaJson: null,
    });
    return { ok: true, login, isAllowed: body.isAllowed };
  }
}

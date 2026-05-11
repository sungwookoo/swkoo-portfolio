import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsString, Matches } from 'class-validator';

import { AuthedRequest, JwtAuthGuard } from '../onboarding/jwt-auth.guard';
import {
  DeployService,
  RegisterResponse,
  RepoSummary,
  StackPreview,
} from './deploy.service';

class RegisterDto {
  @IsString()
  @Matches(/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/, { message: 'fullName must match owner/name' })
  fullName!: string;
}

@Controller('deploy')
@UseGuards(JwtAuthGuard)
export class DeployController {
  constructor(private readonly service: DeployService) {}

  @Get('repos')
  listRepos(@Req() req: AuthedRequest): Promise<RepoSummary[]> {
    return this.service.listRepos(req.user.id);
  }

  @Get('preview')
  detectStack(
    @Req() req: AuthedRequest,
    @Query('repo') repo: string | undefined
  ): Promise<StackPreview> {
    if (!repo) {
      throw new BadRequestException('repo query param required (owner/name)');
    }
    const [owner, name] = repo.split('/');
    if (!owner || !name) {
      throw new BadRequestException('invalid repo format; expected owner/name');
    }
    return this.service.detectStack(req.user.id, owner, name);
  }

  @Post('register')
  register(
    @Req() req: AuthedRequest,
    @Body() body: RegisterDto
  ): Promise<RegisterResponse> {
    return this.service.registerForUser(req.user.githubLogin, body);
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsString, Matches } from 'class-validator';

import { AuthedRequest, JwtAuthGuard } from '../onboarding/jwt-auth.guard';
import {
  CurrentDeployment,
  DeploymentStatus,
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

  @Get('status/:login/:repo')
  getStatus(
    @Req() req: AuthedRequest,
    @Param('login') login: string,
    @Param('repo') repo: string
  ): Promise<DeploymentStatus> {
    return this.service.getDeploymentStatus(req.user.id, login, repo);
  }

  @Get('current')
  getCurrent(@Req() req: AuthedRequest): Promise<CurrentDeployment | null> {
    return this.service.getCurrentDeployment(req.user.githubLogin);
  }

  @Delete()
  @HttpCode(200)
  remove(@Req() req: AuthedRequest): Promise<{ commit: string }> {
    return this.service.deleteDeployment(req.user.githubLogin);
  }
}

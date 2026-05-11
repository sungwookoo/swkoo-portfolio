import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthedRequest, JwtAuthGuard } from '../onboarding/jwt-auth.guard';
import { DeployService, RepoSummary, StackPreview } from './deploy.service';

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
}

import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import type { Request } from 'express';

import { onboardingConfig } from '../config/onboarding.config';
import { EventsRepository, type EventSummary } from '../events/events.repository';
import { OptionalJwtAuthGuard } from '../onboarding/optional-jwt-auth.guard';
import { isVisibleToScope, viewerScopeFor } from '../onboarding/viewer-scope';
import { PipelinesService } from './pipelines.service';
import type { PipelineSummary, PipelinesEnvelope } from './pipelines.types';
import type { WorkflowsEnvelope } from './types/github.types';
import type { DeploymentsEnvelope } from './deployments.types';

@Controller('pipelines')
@UseGuards(OptionalJwtAuthGuard)
export class PipelinesController {
  constructor(
    private readonly pipelinesService: PipelinesService,
    private readonly events: EventsRepository,
    @Inject(onboardingConfig.KEY)
    private readonly config: ConfigType<typeof onboardingConfig>
  ) {}

  @Get()
  async listPipelines(
    @Req() req: Request,
    @Query('scope') scopeQuery?: string
  ): Promise<PipelinesEnvelope> {
    const envelope = await this.pipelinesService.getPipelines();
    const scope = viewerScopeFor(req, this.config.adminLogins, scopeQuery);
    return {
      ...envelope,
      pipelines: envelope.pipelines.filter((p) => isVisibleToScope(p.namespace, scope)),
    };
  }

  @Get(':name')
  async getPipeline(
    @Req() req: Request,
    @Param('name') name: string,
    @Query('scope') scopeQuery?: string
  ): Promise<PipelineSummary> {
    const pipeline = await this.pipelinesService.getPipeline(name);
    await this.assertVisible(req, scopeQuery, pipeline.namespace);
    return pipeline;
  }

  @Get(':name/workflows')
  async getWorkflows(
    @Req() req: Request,
    @Param('name') name: string,
    @Query('scope') scopeQuery?: string,
    @Query('workflow') workflow?: string,
    @Query('page') page?: string,
    @Query('per_page') perPage?: string
  ): Promise<WorkflowsEnvelope> {
    await this.assertNameVisible(req, scopeQuery, name);
    return this.pipelinesService.getWorkflows(name, {
      workflow,
      page: page ? parseInt(page, 10) : undefined,
      perPage: perPage ? parseInt(perPage, 10) : undefined
    });
  }

  @Get(':name/deployments')
  async getDeployments(
    @Req() req: Request,
    @Param('name') name: string,
    @Query('scope') scopeQuery?: string,
    @Query('limit') limit?: string
  ): Promise<DeploymentsEnvelope> {
    await this.assertNameVisible(req, scopeQuery, name);
    const parsed = limit ? parseInt(limit, 10) : 5;
    return this.pipelinesService.getDeployments(name, Number.isFinite(parsed) ? parsed : 5);
  }

  @Get(':name/event-summary')
  async getEventSummary(
    @Req() req: Request,
    @Param('name') name: string,
    @Query('scope') scopeQuery?: string,
    @Query('windowDays') windowDays?: string
  ): Promise<EventSummary> {
    await this.assertNameVisible(req, scopeQuery, name);
    const parsed = windowDays ? parseInt(windowDays, 10) : 7;
    const days = Number.isFinite(parsed) && parsed > 0 ? parsed : 7;
    return this.events.summary(name, days);
  }

  private async assertNameVisible(
    req: Request,
    scopeQuery: string | undefined,
    name: string
  ): Promise<void> {
    const pipeline = await this.pipelinesService.getPipeline(name);
    await this.assertVisible(req, scopeQuery, pipeline.namespace);
  }

  private async assertVisible(
    req: Request,
    scopeQuery: string | undefined,
    namespace: string | null
  ): Promise<void> {
    const scope = viewerScopeFor(req, this.config.adminLogins, scopeQuery);
    if (!isVisibleToScope(namespace, scope)) {
      throw new NotFoundException();
    }
  }
}

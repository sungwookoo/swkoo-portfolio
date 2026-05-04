import { Controller, Get, Param, Query } from '@nestjs/common';

import { EventsRepository, type EventSummary } from '../events/events.repository';
import { PipelinesService } from './pipelines.service';
import type { PipelineSummary, PipelinesEnvelope } from './pipelines.types';
import type { WorkflowsEnvelope } from './types/github.types';
import type { DeploymentsEnvelope } from './deployments.types';

@Controller('pipelines')
export class PipelinesController {
  constructor(
    private readonly pipelinesService: PipelinesService,
    private readonly events: EventsRepository
  ) {}

  @Get()
  async listPipelines(): Promise<PipelinesEnvelope> {
    return this.pipelinesService.getPipelines();
  }

  @Get(':name')
  async getPipeline(@Param('name') name: string): Promise<PipelineSummary> {
    return this.pipelinesService.getPipeline(name);
  }

  @Get(':name/workflows')
  async getWorkflows(
    @Param('name') name: string,
    @Query('workflow') workflow?: string,
    @Query('page') page?: string,
    @Query('per_page') perPage?: string
  ): Promise<WorkflowsEnvelope> {
    return this.pipelinesService.getWorkflows(name, {
      workflow,
      page: page ? parseInt(page, 10) : undefined,
      perPage: perPage ? parseInt(perPage, 10) : undefined
    });
  }

  @Get(':name/deployments')
  async getDeployments(
    @Param('name') name: string,
    @Query('limit') limit?: string
  ): Promise<DeploymentsEnvelope> {
    const parsed = limit ? parseInt(limit, 10) : 5;
    return this.pipelinesService.getDeployments(name, Number.isFinite(parsed) ? parsed : 5);
  }

  @Get(':name/event-summary')
  getEventSummary(
    @Param('name') name: string,
    @Query('windowDays') windowDays?: string
  ): EventSummary {
    const parsed = windowDays ? parseInt(windowDays, 10) : 7;
    const days = Number.isFinite(parsed) && parsed > 0 ? parsed : 7;
    return this.events.summary(name, days);
  }
}

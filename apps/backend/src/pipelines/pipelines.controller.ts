import { Controller, Get, Param, Query } from '@nestjs/common';

import { PipelinesService } from './pipelines.service';
import type { PipelineSummary, PipelinesEnvelope } from './pipelines.types';
import type { WorkflowsEnvelope } from './types/github.types';

@Controller('pipelines')
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

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
}

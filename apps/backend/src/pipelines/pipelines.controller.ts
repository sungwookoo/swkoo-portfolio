import { Controller, Get, Param } from '@nestjs/common';

import { PipelinesService } from './pipelines.service';
import type { PipelineSummary, PipelinesEnvelope } from './pipelines.types';

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
}

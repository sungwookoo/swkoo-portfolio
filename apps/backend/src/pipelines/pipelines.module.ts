import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { PipelinesController } from './pipelines.controller';
import { PipelinesService } from './pipelines.service';
import { ArgoCdClient } from './services/argo-cd.client';

@Module({
  imports: [HttpModule],
  controllers: [PipelinesController],
  providers: [ArgoCdClient, PipelinesService],
  exports: [PipelinesService]
})
export class PipelinesModule {}

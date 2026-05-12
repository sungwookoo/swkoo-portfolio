import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { EventsModule } from '../events/events.module';
import { PipelinesController } from './pipelines.controller';
import { PipelinesService } from './pipelines.service';
import { ArgoCdClient } from './services/argo-cd.client';
import { GitHubClient } from './services/github.client';

@Module({
  imports: [HttpModule, EventsModule],
  controllers: [PipelinesController],
  providers: [ArgoCdClient, GitHubClient, PipelinesService],
  exports: [PipelinesService, ArgoCdClient]
})
export class PipelinesModule {}

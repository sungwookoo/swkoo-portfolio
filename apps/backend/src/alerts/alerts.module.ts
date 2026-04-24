import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { PipelinesModule } from '../pipelines/pipelines.module';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertmanagerClient } from './services/alertmanager.client';

@Module({
  imports: [HttpModule, PipelinesModule],
  controllers: [AlertsController],
  providers: [AlertmanagerClient, AlertsService],
  exports: [AlertsService]
})
export class AlertsModule {}

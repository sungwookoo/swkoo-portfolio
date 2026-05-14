import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { OnboardingModule } from '../onboarding/onboarding.module';
import { PipelinesModule } from '../pipelines/pipelines.module';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertmanagerClient } from './services/alertmanager.client';

@Module({
  imports: [HttpModule, PipelinesModule, OnboardingModule],
  controllers: [AlertsController],
  providers: [AlertmanagerClient, AlertsService],
  exports: [AlertsService]
})
export class AlertsModule {}

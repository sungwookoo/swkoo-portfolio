import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { alertmanagerConfig } from './config/alertmanager.config';
import { githubConfig } from './config/github.config';
import { onboardingConfig } from './config/onboarding.config';
import { pipelinesConfig } from './config/pipelines.config';
import { webhooksConfig } from './config/webhooks.config';

import { AlertsModule } from './alerts/alerts.module';
import { DeployModule } from './deploy/deploy.module';
import { HealthController } from './health/health.controller';
import { MetricsModule } from './metrics/metrics.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { OverviewController } from './overview/overview.controller';
import { OverviewService } from './overview/overview.service';
import { PipelinesModule } from './pipelines/pipelines.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [pipelinesConfig, githubConfig, alertmanagerConfig, webhooksConfig, onboardingConfig]
    }),
    ScheduleModule.forRoot(),
    PipelinesModule,
    AlertsModule,
    MetricsModule,
    WebhooksModule,
    OnboardingModule,
    DeployModule
  ],
  controllers: [HealthController, OverviewController],
  providers: [OverviewService]
})
export class AppModule {}

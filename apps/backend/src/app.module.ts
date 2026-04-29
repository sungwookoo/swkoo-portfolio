import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { alertmanagerConfig } from './config/alertmanager.config';
import { githubConfig } from './config/github.config';
import { pipelinesConfig } from './config/pipelines.config';

import { AlertsModule } from './alerts/alerts.module';
import { HealthController } from './health/health.controller';
import { MetricsModule } from './metrics/metrics.module';
import { OverviewController } from './overview/overview.controller';
import { OverviewService } from './overview/overview.service';
import { PipelinesModule } from './pipelines/pipelines.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [pipelinesConfig, githubConfig, alertmanagerConfig]
    }),
    PipelinesModule,
    AlertsModule,
    MetricsModule
  ],
  controllers: [HealthController, OverviewController],
  providers: [OverviewService]
})
export class AppModule {}

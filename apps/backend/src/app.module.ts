import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { pipelinesConfig } from './config/pipelines.config';

import { HealthController } from './health/health.controller';
import { OverviewController } from './overview/overview.controller';
import { OverviewService } from './overview/overview.service';
import { PipelinesModule } from './pipelines/pipelines.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [pipelinesConfig]
    }),
    PipelinesModule
  ],
  controllers: [HealthController, OverviewController],
  providers: [OverviewService]
})
export class AppModule {}

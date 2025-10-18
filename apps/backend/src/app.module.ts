import { Module } from '@nestjs/common';

import { HealthController } from './health/health.controller';
import { OverviewController } from './overview/overview.controller';
import { OverviewService } from './overview/overview.service';

@Module({
  imports: [],
  controllers: [HealthController, OverviewController],
  providers: [OverviewService]
})
export class AppModule {}

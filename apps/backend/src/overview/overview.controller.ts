import { Controller, Get } from '@nestjs/common';

import { OverviewService } from './overview.service';
import type { PortfolioOverview } from './overview.types';

@Controller('overview')
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get()
  getOverview(): PortfolioOverview {
    return this.overviewService.getOverview();
  }
}

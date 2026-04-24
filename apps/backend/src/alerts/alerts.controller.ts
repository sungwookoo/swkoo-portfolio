import { Controller, Get } from '@nestjs/common';

import { AlertsService } from './alerts.service';
import type { AlertsEnvelope } from './alerts.types';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async listActiveAlerts(): Promise<AlertsEnvelope> {
    return this.alertsService.getActiveAlerts();
  }
}

import { Controller, Get, Inject, Query, Req, UseGuards } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import type { Request } from 'express';

import { onboardingConfig } from '../config/onboarding.config';
import { OptionalJwtAuthGuard } from '../onboarding/optional-jwt-auth.guard';
import { isVisibleToScope, viewerScopeFor } from '../onboarding/viewer-scope';
import { AlertsService } from './alerts.service';
import type { AlertsEnvelope } from './alerts.types';

@Controller('alerts')
@UseGuards(OptionalJwtAuthGuard)
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
    @Inject(onboardingConfig.KEY)
    private readonly config: ConfigType<typeof onboardingConfig>
  ) {}

  @Get()
  async listActiveAlerts(
    @Req() req: Request,
    @Query('scope') scopeQuery?: string
  ): Promise<AlertsEnvelope> {
    const envelope = await this.alertsService.getActiveAlerts();
    const scope = viewerScopeFor(req, this.config.adminLogins, scopeQuery);
    return {
      ...envelope,
      alerts: envelope.alerts.filter((a) => isVisibleToScope(a.namespace, scope)),
    };
  }
}

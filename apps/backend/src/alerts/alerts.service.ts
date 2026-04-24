import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { alertmanagerConfig } from '../config/alertmanager.config';
import { PipelinesService } from '../pipelines/pipelines.service';
import type { PipelineSummary } from '../pipelines/pipelines.types';
import type { AlertSeverity, AlertSummary, AlertsEnvelope } from './alerts.types';
import { AlertmanagerClient } from './services/alertmanager.client';
import type { AlertmanagerAlert } from './types/alertmanager.types';

interface AlertsCache {
  fetchedAt: number;
  data: AlertSummary[];
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);
  private cache: AlertsCache | null = null;

  constructor(
    private readonly alertmanagerClient: AlertmanagerClient,
    private readonly pipelinesService: PipelinesService,
    @Inject(alertmanagerConfig.KEY)
    private readonly config: ConfigType<typeof alertmanagerConfig>
  ) {}

  async getActiveAlerts(): Promise<AlertsEnvelope> {
    if (!this.alertmanagerClient.isConfigured()) {
      return {
        configured: false,
        fetchedAt: null,
        alerts: []
      };
    }

    const ttl = (this.config.cacheTtl ?? 15) * 1000;
    const now = Date.now();

    if (this.cache && now - this.cache.fetchedAt < ttl) {
      return {
        configured: true,
        fetchedAt: new Date(this.cache.fetchedAt).toISOString(),
        alerts: this.cache.data
      };
    }

    const [rawAlerts, pipelinesEnv] = await Promise.all([
      this.alertmanagerClient.listAlerts(),
      this.pipelinesService.getPipelines()
    ]);

    const alerts = rawAlerts
      .filter((a) => (a.status?.state ?? 'active') === 'active')
      .map((a) => this.toAlertSummary(a, pipelinesEnv.pipelines))
      .sort((a, b) => this.severityRank(a.severity) - this.severityRank(b.severity));

    this.cache = { fetchedAt: now, data: alerts };

    return {
      configured: true,
      fetchedAt: new Date(now).toISOString(),
      alerts
    };
  }

  private toAlertSummary(raw: AlertmanagerAlert, pipelines: PipelineSummary[]): AlertSummary {
    const labels = raw.labels ?? {};
    const annotations = raw.annotations ?? {};

    return {
      fingerprint: raw.fingerprint,
      alertname: labels.alertname ?? 'unknown',
      severity: this.normalizeSeverity(labels.severity),
      summary: annotations.summary ?? labels.alertname ?? '',
      description: annotations.description ?? null,
      runbook: annotations.runbook ?? null,
      namespace: labels.namespace ?? null,
      labels,
      startsAt: raw.startsAt ?? null,
      generatorURL: raw.generatorURL ?? null,
      associatedPipeline: this.findAssociatedPipeline(labels, pipelines)
    };
  }

  private findAssociatedPipeline(
    labels: Record<string, string>,
    pipelines: PipelineSummary[]
  ): string | null {
    // 1. app/deployment label direct match
    const appHint = labels.app ?? labels.deployment;
    if (appHint) {
      const match = pipelines.find((p) => p.name === appHint);
      if (match) return match.name;
    }

    // 2. pod name prefix match (strip trailing replicaset/hash suffix)
    if (labels.pod) {
      const podPrefix = labels.pod.replace(/-[a-z0-9]+-[a-z0-9]+$/, '');
      const match = pipelines.find((p) => p.name === podPrefix);
      if (match) return match.name;
    }

    // 3. Argo CD alert rules typically use `name` label for the Application
    if (labels.name) {
      const match = pipelines.find((p) => p.name === labels.name);
      if (match) return match.name;
    }

    return null;
  }

  private normalizeSeverity(raw?: string): AlertSeverity {
    const normalized = raw?.toLowerCase();
    if (normalized === 'critical' || normalized === 'warning' || normalized === 'info') {
      return normalized;
    }
    return 'unknown';
  }

  private severityRank(severity: AlertSeverity): number {
    switch (severity) {
      case 'critical':
        return 0;
      case 'warning':
        return 1;
      case 'info':
        return 2;
      default:
        return 3;
    }
  }
}

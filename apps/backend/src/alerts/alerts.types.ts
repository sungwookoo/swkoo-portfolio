export type AlertSeverity = 'critical' | 'warning' | 'info' | 'unknown';

export interface AlertSummary {
  fingerprint: string;
  alertname: string;
  severity: AlertSeverity;
  summary: string;
  description: string | null;
  runbook: string | null;
  namespace: string | null;
  labels: Record<string, string>;
  startsAt: string | null;
  generatorURL: string | null;
  associatedPipeline: string | null;
}

export interface AlertsEnvelope {
  configured: boolean;
  fetchedAt: string | null;
  alerts: AlertSummary[];
}

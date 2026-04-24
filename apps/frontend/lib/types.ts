export interface PortfolioOverview {
  owner: {
    name: string;
    domain: string;
    mission: string;
  };
  infrastructure: {
    cluster: {
      distribution: string;
      location: string;
      gitOpsTooling: string[];
    };
    controlPlane: string[];
  };
  gitopsVision: {
    description: string;
    roadmap: string[];
  };
}

export interface PipelineSummary {
  name: string;
  project: string;
  namespace: string | null;
  repoUrl: string | null;
  targetRevision: string | null;
  syncStatus: string;
  healthStatus: string;
  lastSyncedAt: string | null;
  lastDeployedAt: string | null;
  revision: string | null;
}

export interface PipelinesEnvelope {
  configured: boolean;
  fetchedAt: string | null;
  pipelines: PipelineSummary[];
}

// GitHub Workflow types
export interface WorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  headSha: string;
  headBranch: string;
  event: string;
  createdAt: string;
  updatedAt: string;
  runDurationSeconds: number | null;
  htmlUrl: string;
}

export interface WorkflowsEnvelope {
  configured: boolean;
  repoUrl: string | null;
  workflows: string[];
  runs: WorkflowRun[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
  };
}

// Alertmanager types
export type AlertSeverity = 'critical' | 'warning' | 'info' | 'unknown';

export interface Alert {
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
  alerts: Alert[];
}

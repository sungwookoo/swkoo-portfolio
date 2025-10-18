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

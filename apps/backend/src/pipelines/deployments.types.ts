export type DeploymentStage = 'commit' | 'build' | 'sync';
export type DeploymentStageStatus = 'success' | 'failure' | 'in_progress';

export interface DeploymentEvent {
  stage: DeploymentStage;
  status: DeploymentStageStatus;
  timestamp: string;
  durationSeconds: number | null;
  label: string;
  href: string | null;
}

export interface DeploymentLifecycle {
  pipeline: string;
  commitSha: string;
  commitShort: string;
  commitMessage: string;
  commitAuthor: string;
  commitAuthorAvatar: string | null;
  commitHref: string | null;
  startedAt: string;
  endedAt: string | null;
  events: DeploymentEvent[];
}

export interface DeploymentsEnvelope {
  configured: boolean;
  fetchedAt: string | null;
  pipeline: string;
  deployments: DeploymentLifecycle[];
}

export interface ArgoCdApplication {
  metadata: {
    name: string;
    namespace?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: {
    project: string;
    destination?: {
      namespace?: string;
      server?: string;
    };
    source?: {
      repoURL?: string;
      targetRevision?: string;
    };
  };
  status?: {
    sync?: {
      status?: string;
      revision?: string;
      comparedTo?: {
        destination?: {
          namespace?: string;
        };
      };
    };
    health?: {
      status?: string;
      message?: string;
    };
    reconciledAt?: string;
    operationState?: {
      phase?: string;
      startedAt?: string;
      finishedAt?: string;
      syncResult?: {
        revision?: string;
      };
    };
    history?: Array<{
      revision?: string;
      deployedAt?: string;
    }>;
  };
}

export interface ArgoCdApplicationListResponse {
  items?: ArgoCdApplication[];
}

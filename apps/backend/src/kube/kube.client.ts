import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AppsV1Api, BatchV1Api, CoreV1Api, CustomObjectsApi, KubeConfig } from '@kubernetes/client-node';

/**
 * Thin wrapper around @kubernetes/client-node. Loads the in-cluster
 * ServiceAccount token at module init; if not running in a cluster (e.g.
 * local dev) it logs a warning and leaves the clients unset. Callers that
 * need k8s API access must check `available()` before reaching for `core`
 * or `apps` — methods on the underlying clients are not nulled out.
 */
@Injectable()
export class KubeClient implements OnModuleInit {
  private readonly logger = new Logger(KubeClient.name);
  core?: CoreV1Api;
  apps?: AppsV1Api;
  custom?: CustomObjectsApi;
  batch?: BatchV1Api;

  onModuleInit(): void {
    try {
      const kc = new KubeConfig();
      kc.loadFromCluster();
      this.core = kc.makeApiClient(CoreV1Api);
      this.apps = kc.makeApiClient(AppsV1Api);
      this.custom = kc.makeApiClient(CustomObjectsApi);
      this.batch = kc.makeApiClient(BatchV1Api);
      this.logger.log('Loaded in-cluster KubeConfig');
    } catch (err) {
      this.logger.warn(
        `In-cluster KubeConfig unavailable (${(err as Error).message}). ` +
          'EnvService, AppSet refresh, and scan dispatch will be no-ops until backend runs inside the cluster.'
      );
    }
  }

  available(): boolean {
    return Boolean(this.core && this.apps && this.custom && this.batch);
  }
}

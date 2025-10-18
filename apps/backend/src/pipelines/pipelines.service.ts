import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { pipelinesConfig } from '../config/pipelines.config';
import type { ArgoCdApplication } from './types/argo-cd.types';
import type { PipelineSummary, PipelinesEnvelope } from './pipelines.types';
import { ArgoCdClient } from './services/argo-cd.client';

interface PipelinesCache {
  fetchedAt: number;
  data: PipelineSummary[];
}

@Injectable()
export class PipelinesService {
  private readonly logger = new Logger(PipelinesService.name);
  private cache: PipelinesCache | null = null;

  constructor(
    private readonly argoCdClient: ArgoCdClient,
    @Inject(pipelinesConfig.KEY)
    private readonly config: ConfigType<typeof pipelinesConfig>
  ) {}

  async getPipelines(): Promise<PipelinesEnvelope> {
    if (!this.argoCdClient.isConfigured()) {
      return {
        configured: false,
        fetchedAt: null,
        pipelines: []
      };
    }

    const ttl = (this.config.cacheTtl ?? 15) * 1000;
    const now = Date.now();

    if (this.cache && now - this.cache.fetchedAt < ttl) {
      return {
        configured: true,
        fetchedAt: new Date(this.cache.fetchedAt).toISOString(),
        pipelines: this.cache.data
      };
    }

    const applications = await this.argoCdClient.listApplications();
    const pipelines = applications.map((app) => this.toPipelineSummary(app));

    this.cache = {
      fetchedAt: now,
      data: pipelines
    };

    return {
      configured: true,
      fetchedAt: new Date(now).toISOString(),
      pipelines
    };
  }

  async getPipeline(name: string): Promise<PipelineSummary> {
    if (!this.argoCdClient.isConfigured()) {
      throw new ServiceUnavailableException('Pipelines module is not yet configured');
    }

    const application = await this.argoCdClient.getApplication(name);

    if (!application) {
      throw new NotFoundException(`Pipeline ${name} not found`);
    }

    return this.toPipelineSummary(application);
  }

  private toPipelineSummary(application: ArgoCdApplication): PipelineSummary {
    const history = application.status?.history ?? [];
    const latestHistory = history.at(-1);

    const sync = application.status?.sync;
    const operation = application.status?.operationState;

    const namespace =
      application.spec.destination?.namespace ??
      sync?.comparedTo?.destination?.namespace ??
      null;

    const lastSyncedAt =
      application.status?.reconciledAt ?? operation?.finishedAt ?? latestHistory?.deployedAt ?? null;

    const lastDeployedAt = latestHistory?.deployedAt ?? operation?.finishedAt ?? null;

    const revision =
      operation?.syncResult?.revision ??
      latestHistory?.revision ??
      sync?.revision ??
      null;

    this.logger.debug(
      `Mapped Argo CD application ${application.metadata?.name ?? 'unknown'} to pipeline summary`
    );

    return {
      name: application.metadata?.name ?? 'unknown',
      project: application.spec.project,
      namespace,
      repoUrl: application.spec.source?.repoURL ?? null,
      targetRevision: application.spec.source?.targetRevision ?? null,
      syncStatus: sync?.status ?? 'Unknown',
      healthStatus: application.status?.health?.status ?? 'Unknown',
      lastSyncedAt,
      lastDeployedAt,
      revision
    };
  }
}

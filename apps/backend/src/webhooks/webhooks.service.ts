import { Injectable, Logger } from '@nestjs/common';

import {
  EventsRepository,
  type DeploymentEventInsert,
  type EventSource
} from '../events/events.repository';

interface NormalizedFields {
  eventType: string;
  pipelineName: string | null;
  commitSha: string | null;
  status: string | null;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly events: EventsRepository) {}

  receive(source: EventSource, rawBody: string, parsed: unknown): number {
    const fields = this.normalize(source, parsed);
    const insert: DeploymentEventInsert = {
      source,
      eventType: fields.eventType,
      pipelineName: fields.pipelineName,
      commitSha: fields.commitSha,
      status: fields.status,
      rawJson: rawBody
    };
    const id = this.events.insert(insert);
    this.logger.log(
      `[${source}] stored event id=${id} type=${fields.eventType} pipeline=${fields.pipelineName ?? '-'} status=${fields.status ?? '-'}`
    );
    return id;
  }

  private normalize(source: EventSource, payload: unknown): NormalizedFields {
    if (!payload || typeof payload !== 'object') {
      return { eventType: 'unknown', pipelineName: null, commitSha: null, status: null };
    }
    if (source === 'github') {
      return this.normalizeGithub(payload as Record<string, unknown>);
    }
    return this.normalizeArgocd(payload as Record<string, unknown>);
  }

  private normalizeGithub(p: Record<string, unknown>): NormalizedFields {
    const action = typeof p.action === 'string' ? p.action : 'unknown';
    const run = (p.workflow_run as Record<string, unknown> | undefined) ?? undefined;
    const repo = (p.repository as Record<string, unknown> | undefined) ?? undefined;
    return {
      eventType: `workflow_run.${action}`,
      pipelineName: typeof repo?.name === 'string' ? (repo.name as string) : null,
      commitSha: typeof run?.head_sha === 'string' ? (run.head_sha as string) : null,
      status:
        typeof run?.conclusion === 'string'
          ? (run.conclusion as string)
          : typeof run?.status === 'string'
            ? (run.status as string)
            : null
    };
  }

  private normalizeArgocd(p: Record<string, unknown>): NormalizedFields {
    // argocd-notifications template controls the shape; treat keys defensively.
    const eventType = typeof p.eventType === 'string' ? (p.eventType as string) : 'sync';
    const pipelineName = typeof p.app === 'string' ? (p.app as string) : null;
    const commitSha = typeof p.revision === 'string' ? (p.revision as string) : null;
    const status =
      typeof p.healthStatus === 'string'
        ? (p.healthStatus as string)
        : typeof p.syncStatus === 'string'
          ? (p.syncStatus as string)
          : null;
    return { eventType, pipelineName, commitSha, status };
  }
}

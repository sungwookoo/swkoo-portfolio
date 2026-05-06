import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import Database, { Database as Db } from 'better-sqlite3';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';

import { webhooksConfig } from '../config/webhooks.config';

export type EventSource = 'argocd' | 'github';

export interface DeploymentEventInsert {
  source: EventSource;
  eventType: string;
  pipelineName: string | null;
  commitSha: string | null;
  status: string | null;
  rawJson: string;
}

export interface DeploymentEventRow {
  id: number;
  receivedAt: string;
  source: EventSource;
  eventType: string;
  pipelineName: string | null;
  commitSha: string | null;
  status: string | null;
  rawJson: string;
}

export interface EventSummary {
  pipelineName: string;
  windowDays: number;
  deployCount: number;
  failureCount: number;
  lastEventAt: string | null;
  lastEventType: string | null;
  // MTTR: average seconds from a sync_failed to the following sync_succeeded.
  // null when no failure→success pair exists in the window.
  mttrSeconds: number | null;
  // Average seconds between consecutive sync_succeeded events (deploy cadence).
  // null when fewer than 2 successes exist in the window.
  avgIntervalSeconds: number | null;
}

@Injectable()
export class EventsRepository implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsRepository.name);
  private db!: Db;

  constructor(
    @Inject(webhooksConfig.KEY)
    private readonly config: ConfigType<typeof webhooksConfig>
  ) {}

  onModuleInit(): void {
    mkdirSync(dirname(this.config.dbPath), { recursive: true });
    this.db = new Database(this.config.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS deployment_events (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        received_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        source        TEXT    NOT NULL,
        event_type    TEXT    NOT NULL,
        pipeline_name TEXT,
        commit_sha    TEXT,
        status        TEXT,
        raw_json      TEXT    NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_deployment_events_pipeline_time
        ON deployment_events (pipeline_name, received_at DESC);
      CREATE INDEX IF NOT EXISTS idx_deployment_events_source_time
        ON deployment_events (source, received_at DESC);
    `);
    this.logger.log(`Event store ready at ${this.config.dbPath}`);
  }

  onModuleDestroy(): void {
    this.db?.close();
  }

  insert(event: DeploymentEventInsert): number {
    const stmt = this.db.prepare(`
      INSERT INTO deployment_events
        (source, event_type, pipeline_name, commit_sha, status, raw_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      event.source,
      event.eventType,
      event.pipelineName,
      event.commitSha,
      event.status,
      event.rawJson
    );
    return Number(result.lastInsertRowid);
  }

  recent(limit: number): DeploymentEventRow[] {
    const stmt = this.db.prepare(`
      SELECT id, received_at AS receivedAt, source, event_type AS eventType,
             pipeline_name AS pipelineName, commit_sha AS commitSha,
             status, raw_json AS rawJson
      FROM deployment_events
      ORDER BY received_at DESC
      LIMIT ?
    `);
    return stmt.all(limit) as DeploymentEventRow[];
  }

  summary(pipelineName: string, windowDays = 7): EventSummary {
    const sinceIso = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)
      .toISOString();
    const counts = this.db.prepare(`
      SELECT
        SUM(CASE WHEN event_type = 'sync_succeeded' THEN 1 ELSE 0 END) AS deploys,
        SUM(CASE WHEN event_type = 'sync_failed' THEN 1 ELSE 0 END) AS failures
      FROM deployment_events
      WHERE pipeline_name = ? AND received_at >= ?
    `).get(pipelineName, sinceIso) as { deploys: number | null; failures: number | null };

    const last = this.db.prepare(`
      SELECT received_at AS receivedAt, event_type AS eventType
      FROM deployment_events
      WHERE pipeline_name = ?
      ORDER BY received_at DESC
      LIMIT 1
    `).get(pipelineName) as { receivedAt: string; eventType: string } | undefined;

    const seq = this.db.prepare(`
      SELECT received_at AS receivedAt, event_type AS eventType
      FROM deployment_events
      WHERE pipeline_name = ? AND received_at >= ?
        AND event_type IN ('sync_succeeded', 'sync_failed')
      ORDER BY received_at ASC
    `).all(pipelineName, sinceIso) as { receivedAt: string; eventType: string }[];

    const recoveryTimes: number[] = [];
    let lastFailureMs: number | null = null;
    for (const ev of seq) {
      const t = new Date(ev.receivedAt).getTime();
      if (ev.eventType === 'sync_failed') {
        lastFailureMs = t;
      } else if (ev.eventType === 'sync_succeeded' && lastFailureMs !== null) {
        recoveryTimes.push((t - lastFailureMs) / 1000);
        lastFailureMs = null;
      }
    }
    const mttrSeconds = recoveryTimes.length > 0
      ? Math.round(recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length)
      : null;

    const successes = seq.filter((e) => e.eventType === 'sync_succeeded');
    const intervals: number[] = [];
    for (let i = 1; i < successes.length; i++) {
      const a = new Date(successes[i - 1].receivedAt).getTime();
      const b = new Date(successes[i].receivedAt).getTime();
      intervals.push((b - a) / 1000);
    }
    const avgIntervalSeconds = intervals.length > 0
      ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
      : null;

    return {
      pipelineName,
      windowDays,
      deployCount: counts.deploys ?? 0,
      failureCount: counts.failures ?? 0,
      lastEventAt: last?.receivedAt ?? null,
      lastEventType: last?.eventType ?? null,
      mttrSeconds,
      avgIntervalSeconds
    };
  }
}

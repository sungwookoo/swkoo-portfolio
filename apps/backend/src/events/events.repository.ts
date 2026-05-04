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
}

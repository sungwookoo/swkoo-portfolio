import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import Database, { Database as Db } from 'better-sqlite3';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';

import { webhooksConfig } from '../config/webhooks.config';

export interface UserUpsert {
  githubId: number;
  githubLogin: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export interface UserRow {
  id: number;
  githubId: number;
  githubLogin: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuditLogInsert {
  actor: string;
  action: string;
  target: string | null;
  reason: string | null;
  metaJson: string | null;
}

@Injectable()
export class UsersRepository implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UsersRepository.name);
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
      CREATE TABLE IF NOT EXISTS users (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        github_id     INTEGER NOT NULL UNIQUE,
        github_login  TEXT    NOT NULL UNIQUE,
        name          TEXT,
        email         TEXT,
        avatar_url    TEXT,
        created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        last_login_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
      CREATE TABLE IF NOT EXISTS audit_log (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        actor     TEXT    NOT NULL,
        action    TEXT    NOT NULL,
        target    TEXT,
        reason    TEXT,
        meta_json TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_audit_log_actor_at ON audit_log (actor, at DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_log_action_at ON audit_log (action, at DESC);
    `);
    this.logger.log('users + audit_log tables ready');
  }

  onModuleDestroy(): void {
    this.db?.close();
  }

  upsertUser(u: UserUpsert): UserRow {
    const stmt = this.db.prepare(`
      INSERT INTO users (github_id, github_login, name, email, avatar_url)
      VALUES (@githubId, @githubLogin, @name, @email, @avatarUrl)
      ON CONFLICT(github_id) DO UPDATE SET
        github_login = excluded.github_login,
        name = excluded.name,
        email = excluded.email,
        avatar_url = excluded.avatar_url,
        last_login_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      RETURNING id, github_id AS githubId, github_login AS githubLogin,
                name, email, avatar_url AS avatarUrl,
                created_at AS createdAt, last_login_at AS lastLoginAt
    `);
    return stmt.get(u) as UserRow;
  }

  findById(id: number): UserRow | undefined {
    const stmt = this.db.prepare(`
      SELECT id, github_id AS githubId, github_login AS githubLogin,
             name, email, avatar_url AS avatarUrl,
             created_at AS createdAt, last_login_at AS lastLoginAt
      FROM users WHERE id = ?
    `);
    return stmt.get(id) as UserRow | undefined;
  }

  audit(entry: AuditLogInsert): void {
    const stmt = this.db.prepare(`
      INSERT INTO audit_log (actor, action, target, reason, meta_json)
      VALUES (@actor, @action, @target, @reason, @metaJson)
    `);
    stmt.run(entry);
  }
}

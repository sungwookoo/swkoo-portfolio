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
  isAllowed: boolean;
}

export interface TokenSet {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string;
}

export interface TokenRow extends TokenSet {
  userId: number;
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
    // Idempotent column adds (SQLite has no "ADD COLUMN IF NOT EXISTS").
    // GitHub App user tokens expire (8h by default); we refresh on demand.
    this.addColumnIfMissing('users', 'access_token', 'TEXT');
    this.addColumnIfMissing('users', 'refresh_token', 'TEXT');
    this.addColumnIfMissing('users', 'token_expires_at', 'TEXT');
    // Phase 2.7: allowlist moved from env (DEPLOY_ALLOWLIST) to DB column.
    // Env still seeds initial state on boot via seedAllowlist(); after that
    // the /admin UI is the source of truth.
    this.addColumnIfMissing('users', 'is_allowed', 'INTEGER NOT NULL DEFAULT 0');
    this.logger.log('users + audit_log tables ready');
  }

  private addColumnIfMissing(table: string, column: string, type: string): void {
    const cols = this.db
      .prepare(`PRAGMA table_info(${table})`)
      .all() as Array<{ name: string }>;
    if (cols.some((c) => c.name === column)) return;
    this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }

  onModuleDestroy(): void {
    this.db?.close();
  }

  private readonly userColumns = `
    id, github_id AS githubId, github_login AS githubLogin,
    name, email, avatar_url AS avatarUrl,
    created_at AS createdAt, last_login_at AS lastLoginAt,
    CASE WHEN is_allowed = 1 THEN 1 ELSE 0 END AS isAllowed
  `;

  private hydrate(row: unknown): UserRow {
    const r = row as UserRow & { isAllowed: number | boolean };
    return { ...r, isAllowed: Boolean(r.isAllowed) };
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
      RETURNING ${this.userColumns}
    `);
    return this.hydrate(stmt.get(u));
  }

  findById(id: number): UserRow | undefined {
    const stmt = this.db.prepare(`
      SELECT ${this.userColumns}
      FROM users WHERE id = ?
    `);
    const row = stmt.get(id);
    return row ? this.hydrate(row) : undefined;
  }

  findByLogin(login: string): UserRow | undefined {
    const stmt = this.db.prepare(`
      SELECT ${this.userColumns}
      FROM users WHERE github_login = ?
    `);
    const row = stmt.get(login);
    return row ? this.hydrate(row) : undefined;
  }

  listAllUsers(): UserRow[] {
    const stmt = this.db.prepare(`
      SELECT ${this.userColumns}
      FROM users
      ORDER BY last_login_at DESC
    `);
    return stmt.all().map((row) => this.hydrate(row));
  }

  /** Returns true if a user row exists for the login. The /admin UI surfaces
   *  the "not in DB" case (env-listed login that never signed in) as a hint. */
  setAllowed(login: string, isAllowed: boolean): boolean {
    // Case-insensitive match — GitHub treats usernames case-insensitively
    // in URLs, and stored casing reflects whatever GH last sent on login.
    const result = this.db
      .prepare(`UPDATE users SET is_allowed = ? WHERE LOWER(github_login) = ?`)
      .run(isAllowed ? 1 : 0, login.toLowerCase());
    return result.changes > 0;
  }

  /** One-way seed from DEPLOY_ALLOWLIST env → DB on every boot. Only flips
   *  is_allowed 0 → 1 for existing rows; never inserts. Users not yet in DB
   *  get the same flip on their first sign-in via AuthService. */
  seedAllowlist(logins: string[]): number {
    if (logins.length === 0) return 0;
    const placeholders = logins.map(() => '?').join(',');
    const result = this.db
      .prepare(
        `UPDATE users SET is_allowed = 1
         WHERE is_allowed = 0
           AND LOWER(github_login) IN (${placeholders})`
      )
      .run(...logins.map((l) => l.toLowerCase()));
    return result.changes;
  }

  audit(entry: AuditLogInsert): void {
    const stmt = this.db.prepare(`
      INSERT INTO audit_log (actor, action, target, reason, meta_json)
      VALUES (@actor, @action, @target, @reason, @metaJson)
    `);
    stmt.run(entry);
  }

  saveTokens(userId: number, tokens: TokenSet): void {
    this.db
      .prepare(`
        UPDATE users
        SET access_token = @accessToken,
            refresh_token = @refreshToken,
            token_expires_at = @expiresAt
        WHERE id = @userId
      `)
      .run({ userId, ...tokens });
  }

  getTokens(userId: number): TokenSet | null {
    const row = this.db
      .prepare(`
        SELECT access_token AS accessToken,
               refresh_token AS refreshToken,
               token_expires_at AS expiresAt
        FROM users WHERE id = ?
      `)
      .get(userId) as { accessToken: string | null; refreshToken: string | null; expiresAt: string | null } | undefined;
    if (!row?.accessToken || !row.expiresAt) return null;
    return {
      accessToken: row.accessToken,
      refreshToken: row.refreshToken,
      expiresAt: row.expiresAt,
    };
  }
}

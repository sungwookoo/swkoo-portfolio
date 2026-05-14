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
  policyVersion: string | null;
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
    // Phase 3.2: account deletion (K-PIPA Art.36 / GDPR Art.17). Soft-deleted
    // rows keep an anonymized shell — github_id flipped to -id (negative
    // values can't collide with GitHub's positive IDs), github_login becomes
    // "deleted_<id>" — so the NOT NULL UNIQUE constraints survive without
    // making the row identifiable. A separate cron (TODO) hard-deletes rows
    // older than 30 days per the privacy policy.
    this.addColumnIfMissing('users', 'deleted_at', 'TEXT');
    // Phase 3.2: privacy/terms consent tracking. policy_version captures the
    // version the user last accepted; bumping CURRENT_POLICY_VERSION forces a
    // re-consent. Nullable for legacy rows pre-consent feature — those are
    // also routed through the consent screen on first /deploy visit.
    this.addColumnIfMissing('users', 'policy_version', 'TEXT');
    this.addColumnIfMissing('users', 'policy_accepted_at', 'TEXT');
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
    CASE WHEN is_allowed = 1 THEN 1 ELSE 0 END AS isAllowed,
    policy_version AS policyVersion
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
      FROM users WHERE id = ? AND deleted_at IS NULL
    `);
    const row = stmt.get(id);
    return row ? this.hydrate(row) : undefined;
  }

  findByLogin(login: string): UserRow | undefined {
    const stmt = this.db.prepare(`
      SELECT ${this.userColumns}
      FROM users WHERE github_login = ? AND deleted_at IS NULL
    `);
    const row = stmt.get(login);
    return row ? this.hydrate(row) : undefined;
  }

  findByGithubId(githubId: number): UserRow | undefined {
    const stmt = this.db.prepare(`
      SELECT ${this.userColumns}
      FROM users WHERE github_id = ? AND deleted_at IS NULL
    `);
    const row = stmt.get(githubId);
    return row ? this.hydrate(row) : undefined;
  }

  listAllUsers(): UserRow[] {
    const stmt = this.db.prepare(`
      SELECT ${this.userColumns}
      FROM users
      WHERE deleted_at IS NULL
      ORDER BY last_login_at DESC
    `);
    return stmt.all().map((row) => this.hydrate(row));
  }

  /** K-PIPA Art.36 erasure: anonymize the row in place. Keeps the FK-like
   * shape audit_log relies on (actor TEXT) but scrubs identifying fields.
   * audit_log entries for this user get their actor rewritten to the same
   * deleted_<id> placeholder. Hard delete after 30d is a separate job. */
  softDeleteUser(id: number): void {
    const tx = this.db.transaction((userId: number) => {
      const placeholder = `deleted_${userId}`;
      const row = this.db
        .prepare(`SELECT github_login FROM users WHERE id = ?`)
        .get(userId) as { github_login: string } | undefined;
      if (!row) return;
      this.db
        .prepare(
          `UPDATE audit_log SET actor = ? WHERE actor = ?`
        )
        .run(placeholder, row.github_login);
      this.db
        .prepare(
          `UPDATE users SET
             github_id     = -id,
             github_login  = ?,
             name          = NULL,
             email         = NULL,
             avatar_url    = NULL,
             access_token  = NULL,
             refresh_token = NULL,
             token_expires_at = NULL,
             is_allowed    = 0,
             deleted_at    = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           WHERE id = ?`
        )
        .run(placeholder, userId);
    });
    tx(id);
  }

  acceptPolicy(userId: number, version: string): void {
    this.db
      .prepare(
        `UPDATE users
         SET policy_version = ?,
             policy_accepted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?`
      )
      .run(version, userId);
  }

  /** Hard-deletes soft-deleted users whose deleted_at is older than the
   * cutoff, along with their anonymized audit_log rows. Used by the daily
   * cleanup cron to enforce the 30-day retention promised in the privacy
   * policy. Returns the number of users hard-deleted. */
  hardDeleteOldUsers(cutoffIso: string): number {
    const tx = this.db.transaction((cutoff: string) => {
      const rows = this.db
        .prepare(`SELECT id FROM users WHERE deleted_at IS NOT NULL AND deleted_at < ?`)
        .all(cutoff) as Array<{ id: number }>;
      if (rows.length === 0) return 0;
      const deletePlaceholders = rows.map((r) => `deleted_${r.id}`);
      const ph = deletePlaceholders.map(() => '?').join(',');
      this.db.prepare(`DELETE FROM audit_log WHERE actor IN (${ph})`).run(...deletePlaceholders);
      this.db
        .prepare(`DELETE FROM users WHERE deleted_at IS NOT NULL AND deleted_at < ?`)
        .run(cutoff);
      return rows.length;
    });
    return tx(cutoffIso);
  }

  /** Read audit entries authored by this user. Used for data export. */
  listAuditByActor(actor: string): Array<{
    at: string;
    action: string;
    target: string | null;
    reason: string | null;
    metaJson: string | null;
  }> {
    return this.db
      .prepare(
        `SELECT at, action, target, reason, meta_json AS metaJson
         FROM audit_log WHERE actor = ? ORDER BY at DESC`
      )
      .all(actor) as Array<{
      at: string;
      action: string;
      target: string | null;
      reason: string | null;
      metaJson: string | null;
    }>;
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

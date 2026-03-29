/**
 * SQLite 持久化存储层
 */

import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import type { Installation } from "./hub/types.js";

export class Store {
  private db: Database.Database;

  constructor(dbPath: string) {
    if (dbPath !== ":memory:") {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.initTables();
  }

  private initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS installations (
        id TEXT PRIMARY KEY, hub_url TEXT NOT NULL, app_id TEXT NOT NULL,
        bot_id TEXT NOT NULL, app_token TEXT NOT NULL, webhook_secret TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }

  saveInstallation(inst: Installation): void {
    this.db.prepare(`
      INSERT INTO installations (id, hub_url, app_id, bot_id, app_token, webhook_secret, created_at)
      VALUES (@id, @hubUrl, @appId, @botId, @appToken, @webhookSecret, @createdAt)
      ON CONFLICT(id) DO UPDATE SET
        hub_url = excluded.hub_url, app_id = excluded.app_id,
        bot_id = excluded.bot_id, app_token = excluded.app_token,
        webhook_secret = excluded.webhook_secret
    `).run({
      id: inst.id, hubUrl: inst.hubUrl, appId: inst.appId,
      botId: inst.botId, appToken: inst.appToken,
      webhookSecret: inst.webhookSecret,
      createdAt: inst.createdAt || new Date().toISOString(),
    });
  }

  getInstallation(id: string): Installation | undefined {
    const row = this.db.prepare("SELECT * FROM installations WHERE id = ?")
      .get(id) as Record<string, string> | undefined;
    if (!row) return undefined;
    return {
      id: row.id, hubUrl: row.hub_url, appId: row.app_id,
      botId: row.bot_id, appToken: row.app_token,
      webhookSecret: row.webhook_secret, createdAt: row.created_at,
    };
  }

  getAllInstallations(): Installation[] {
    const rows = this.db.prepare("SELECT * FROM installations ORDER BY created_at DESC")
      .all() as Record<string, string>[];
    return rows.map((row) => ({
      id: row.id, hubUrl: row.hub_url, appId: row.app_id,
      botId: row.bot_id, appToken: row.app_token,
      webhookSecret: row.webhook_secret, createdAt: row.created_at,
    }));
  }

  close(): void { this.db.close(); }
}

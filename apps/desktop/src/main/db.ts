import Database from "better-sqlite3";
import { join } from "path";
import { app } from "electron";

let db: Database.Database;

export interface ClipRow {
  id: string;
  type: string;
  content: string;
  content_hash: string;
  summary: string | null;
  tags: string; // JSON array
  mood: string | null;
  actions: string; // JSON array
  sensitivity: string | null;
  source_app: string | null;
  pinned: number;
  archived: number;
  enriched: number;
  created_at: string;
}

export function initDb() {
  const dbPath = join(app.getPath("userData"), "ghostclip.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS clips (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      summary TEXT,
      tags TEXT DEFAULT '[]',
      mood TEXT,
      actions TEXT DEFAULT '[]',
      sensitivity TEXT,
      source_app TEXT,
      pinned INTEGER DEFAULT 0,
      archived INTEGER DEFAULT 0,
      enriched INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_clips_created ON clips(created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_clips_hash ON clips(content_hash)`);

  return db;
}

export function insertClip(clip: any) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO clips (id, type, content, content_hash, summary, tags, mood, actions, sensitivity, source_app, pinned, archived, enriched, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    clip.id,
    clip.type,
    clip.content,
    clip.contentHash,
    clip.summary,
    JSON.stringify(clip.tags || []),
    clip.mood,
    JSON.stringify(clip.actions || []),
    clip.sensitivity,
    clip.sourceApp,
    clip.pinned ? 1 : 0,
    clip.archived ? 1 : 0,
    clip.enriched ? 1 : 0,
    clip.createdAt,
  );
}

export function updateClip(clip: any) {
  const stmt = db.prepare(`
    UPDATE clips SET summary=?, tags=?, mood=?, actions=?, sensitivity=?, pinned=?, archived=?, enriched=?
    WHERE id=?
  `);
  stmt.run(
    clip.summary,
    JSON.stringify(clip.tags || []),
    clip.mood,
    JSON.stringify(clip.actions || []),
    clip.sensitivity,
    clip.pinned ? 1 : 0,
    clip.archived ? 1 : 0,
    clip.enriched ? 1 : 0,
    clip.id,
  );
}

export function getAllClips(limit = 500): any[] {
  const rows = db.prepare(`SELECT * FROM clips ORDER BY created_at DESC LIMIT ?`).all(limit) as ClipRow[];
  return rows.map(rowToClip);
}

export function deleteClipById(id: string) {
  db.prepare(`DELETE FROM clips WHERE id = ?`).run(id);
}

export function searchClips(query: string): any[] {
  const q = `%${query}%`;
  const rows = db.prepare(`
    SELECT * FROM clips
    WHERE summary LIKE ? OR tags LIKE ? OR content LIKE ?
    ORDER BY created_at DESC LIMIT 100
  `).all(q, q, q) as ClipRow[];
  return rows.map(rowToClip);
}

export function hashExists(hash: string): boolean {
  const row = db.prepare(`SELECT id FROM clips WHERE content_hash = ? LIMIT 1`).get(hash);
  return !!row;
}

function rowToClip(row: ClipRow) {
  return {
    id: row.id,
    type: row.type,
    content: row.content,
    contentHash: row.content_hash,
    summary: row.summary,
    tags: JSON.parse(row.tags || "[]"),
    mood: row.mood,
    actions: JSON.parse(row.actions || "[]"),
    sensitivity: row.sensitivity,
    sourceApp: row.source_app,
    pinned: !!row.pinned,
    archived: !!row.archived,
    enriched: !!row.enriched,
    createdAt: row.created_at,
  };
}

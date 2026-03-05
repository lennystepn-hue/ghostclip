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

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '📁',
      clip_ids TEXT DEFAULT '[]',
      created_at TEXT NOT NULL
    )
  `);

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

// Settings
export function getSetting(key: string, defaultValue: string = ""): string {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as any;
  return row?.value ?? defaultValue;
}

export function setSetting(key: string, value: string) {
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
}

export function getAllSettings(): Record<string, string> {
  const rows = db.prepare("SELECT key, value FROM settings").all() as any[];
  const result: Record<string, string> = {};
  for (const row of rows) result[row.key] = row.value;
  return result;
}

// Collections
export function getCollections(): any[] {
  const rows = db.prepare("SELECT * FROM collections ORDER BY created_at DESC").all() as any[];
  return rows.map(r => ({ ...r, clipIds: JSON.parse(r.clip_ids || "[]") }));
}

export function createCollection(id: string, name: string, icon: string) {
  db.prepare("INSERT INTO collections (id, name, icon, created_at) VALUES (?, ?, ?, ?)").run(id, name, icon, new Date().toISOString());
}

export function addClipToCollection(collectionId: string, clipId: string) {
  const row = db.prepare("SELECT clip_ids FROM collections WHERE id = ?").get(collectionId) as any;
  if (!row) return;
  const ids = JSON.parse(row.clip_ids || "[]");
  if (!ids.includes(clipId)) {
    ids.push(clipId);
    db.prepare("UPDATE collections SET clip_ids = ? WHERE id = ?").run(JSON.stringify(ids), collectionId);
  }
}

export function removeClipFromCollection(collectionId: string, clipId: string) {
  const row = db.prepare("SELECT clip_ids FROM collections WHERE id = ?").get(collectionId) as any;
  if (!row) return;
  const ids = JSON.parse(row.clip_ids || "[]").filter((id: string) => id !== clipId);
  db.prepare("UPDATE collections SET clip_ids = ? WHERE id = ?").run(JSON.stringify(ids), collectionId);
}

export function deleteCollection(id: string) {
  db.prepare("DELETE FROM collections WHERE id = ?").run(id);
}

// Analytics
export function getClipStats() {
  const total = (db.prepare("SELECT COUNT(*) as count FROM clips WHERE archived = 0").get() as any).count;
  const pinned = (db.prepare("SELECT COUNT(*) as count FROM clips WHERE pinned = 1").get() as any).count;
  const today = (db.prepare("SELECT COUNT(*) as count FROM clips WHERE date(created_at) = date('now')").get() as any).count;
  const thisWeek = (db.prepare("SELECT COUNT(*) as count FROM clips WHERE created_at > datetime('now', '-7 days')").get() as any).count;

  const byType = db.prepare("SELECT type, COUNT(*) as count FROM clips WHERE archived = 0 GROUP BY type").all() as any[];

  const topTags = db.prepare("SELECT tags FROM clips WHERE tags != '[]' ORDER BY created_at DESC LIMIT 200").all() as any[];
  const tagCounts: Record<string, number> = {};
  for (const row of topTags) {
    for (const tag of JSON.parse(row.tags)) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([tag, count]) => ({ tag, count }));

  const weeklyActivity = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as count
    FROM clips
    WHERE created_at > datetime('now', '-7 days')
    GROUP BY date(created_at)
    ORDER BY day
  `).all() as any[];

  return { total, pinned, today, thisWeek, byType, topTags: sortedTags, weeklyActivity };
}

// Auto-expire: delete clips where sensitivity is critical or high and older than 5 minutes
export function cleanExpiredClips(): number {
  const result = db.prepare(`
    DELETE FROM clips WHERE sensitivity IN ('critical', 'high')
    AND created_at < datetime('now', '-5 minutes')
  `).run();
  return result.changes;
}

// Get all unique tags
export function getAllTags(): { tag: string; count: number }[] {
  const rows = db.prepare("SELECT tags FROM clips WHERE tags != '[]' AND archived = 0").all() as any[];
  const tagCounts: Record<string, number> = {};
  for (const row of rows) {
    for (const tag of JSON.parse(row.tags)) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }));
}

// Get clips by tag
export function getClipsByTag(tag: string): any[] {
  const rows = db.prepare("SELECT * FROM clips WHERE tags LIKE ? AND archived = 0 ORDER BY created_at DESC").all(`%"${tag}"%`) as ClipRow[];
  return rows.map(rowToClip);
}

// Clear all clips (panic button)
export function clearAllClips() {
  db.prepare("DELETE FROM clips").run();
}

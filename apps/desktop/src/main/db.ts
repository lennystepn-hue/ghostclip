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
      embedding TEXT DEFAULT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // Migration: add embedding column if missing (for existing DBs)
  try {
    db.exec(`ALTER TABLE clips ADD COLUMN embedding TEXT DEFAULT NULL`);
  } catch {
    // Column already exists
  }

  // Migration: add image_data column for storing base64 image data
  try {
    db.exec(`ALTER TABLE clips ADD COLUMN image_data TEXT DEFAULT NULL`);
  } catch {
    // Column already exists
  }

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
      smart_rule TEXT DEFAULT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // Migration: add smart_rule column if missing
  try {
    db.exec(`ALTER TABLE collections ADD COLUMN smart_rule TEXT DEFAULT NULL`);
  } catch {
    // Column already exists
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'allgemein',
      variables TEXT DEFAULT '[]',
      use_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);

  // Predictive paste: track copy-paste sequences
  db.exec(`
    CREATE TABLE IF NOT EXISTS paste_sequences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clip_id TEXT NOT NULL,
      next_clip_id TEXT NOT NULL,
      source_app TEXT,
      count INTEGER DEFAULT 1,
      last_used TEXT NOT NULL,
      UNIQUE(clip_id, next_clip_id)
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_paste_seq_clip ON paste_sequences(clip_id)`);

  // Predictive paste: hourly usage patterns
  db.exec(`
    CREATE TABLE IF NOT EXISTS hourly_patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clip_id TEXT NOT NULL,
      hour INTEGER NOT NULL,
      count INTEGER DEFAULT 1,
      UNIQUE(clip_id, hour)
    )
  `);

  return db;
}

export function insertClip(clip: any) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO clips (id, type, content, content_hash, summary, tags, mood, actions, sensitivity, source_app, pinned, archived, enriched, image_data, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    clip.imageData || null,
    clip.createdAt,
  );
}

export function updateClip(clip: any) {
  const stmt = db.prepare(`
    UPDATE clips SET content=?, summary=?, tags=?, mood=?, actions=?, sensitivity=?, pinned=?, archived=?, enriched=?, image_data=?
    WHERE id=?
  `);
  stmt.run(
    clip.content,
    clip.summary,
    JSON.stringify(clip.tags || []),
    clip.mood,
    JSON.stringify(clip.actions || []),
    clip.sensitivity,
    clip.pinned ? 1 : 0,
    clip.archived ? 1 : 0,
    clip.enriched ? 1 : 0,
    clip.imageData || null,
    clip.id,
  );
}

export function getAllClips(limit = 500): any[] {
  const rows = db.prepare(`SELECT * FROM clips ORDER BY created_at DESC LIMIT ?`).all(limit) as ClipRow[];
  return rows.map(rowToClip);
}

export function getClipCount(): number {
  const row = db.prepare(`SELECT COUNT(*) as count FROM clips`).get() as { count: number };
  return row.count;
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
    imageData: (row as any).image_data || null,
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

export function createSmartCollection(id: string, name: string, icon: string, rule: object) {
  db.prepare("INSERT INTO collections (id, name, icon, smart_rule, created_at) VALUES (?, ?, ?, ?, ?)").run(
    id, name, icon, JSON.stringify(rule), new Date().toISOString()
  );
}

/** Evaluate a smart rule against all clips and return matching ones */
export function getSmartCollectionClips(collectionId: string): any[] {
  const row = db.prepare("SELECT smart_rule FROM collections WHERE id = ?").get(collectionId) as any;
  if (!row?.smart_rule) return [];

  const rule = JSON.parse(row.smart_rule);
  // Rule format: { tag?: string, type?: string, mood?: string, contains?: string, minAge?: string, maxAge?: string }

  let query = "SELECT * FROM clips WHERE archived = 0";
  const params: any[] = [];

  if (rule.tag) {
    query += ` AND tags LIKE ?`;
    params.push(`%"${rule.tag}"%`);
  }
  if (rule.type) {
    query += ` AND type = ?`;
    params.push(rule.type);
  }
  if (rule.mood) {
    query += ` AND mood LIKE ?`;
    params.push(`%${rule.mood}%`);
  }
  if (rule.contains) {
    query += ` AND (content LIKE ? OR summary LIKE ?)`;
    params.push(`%${rule.contains}%`, `%${rule.contains}%`);
  }
  if (rule.maxAge) {
    query += ` AND created_at > datetime('now', ?)`;
    params.push(`-${rule.maxAge}`);
  }

  query += " ORDER BY created_at DESC LIMIT 200";

  const rows = db.prepare(query).all(...params) as ClipRow[];
  return rows.map(rowToClip);
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

// Embeddings for semantic search
export function updateClipEmbedding(id: string, embedding: number[]) {
  db.prepare("UPDATE clips SET embedding = ? WHERE id = ?").run(JSON.stringify(embedding), id);
}

export function getClipsWithEmbeddings(): { id: string; embedding: number[]; summary: string; content: string; tags: string }[] {
  const rows = db.prepare("SELECT id, embedding, summary, content, tags FROM clips WHERE embedding IS NOT NULL AND archived = 0").all() as any[];
  return rows.map(r => ({
    id: r.id,
    embedding: JSON.parse(r.embedding),
    summary: r.summary || "",
    content: r.content || "",
    tags: r.tags || "[]",
  }));
}

// Learning context: build a summary of recent clips for AI enrichment context
export function getRecentClipsSummary(limit = 5): string {
  const rows = db.prepare(
    `SELECT summary, tags, mood, type, source_app FROM clips WHERE enriched = 1 AND archived = 0 ORDER BY created_at DESC LIMIT ?`
  ).all(limit) as any[];
  if (rows.length === 0) return "";
  return rows.map((r, i) => {
    const tags = JSON.parse(r.tags || "[]").join(", ");
    return `${i + 1}. [${r.type}] ${r.summary || "?"} | Tags: ${tags} | Mood: ${r.mood || "?"} | App: ${r.source_app || "?"}`;
  }).join("\n");
}

// Learning context: get user's top tags (shows interests/work patterns)
export function getUserProfile(): string {
  const tagRows = db.prepare("SELECT tags FROM clips WHERE tags != '[]' AND archived = 0 ORDER BY created_at DESC LIMIT 100").all() as any[];
  const tagCounts: Record<string, number> = {};
  for (const row of tagRows) {
    for (const tag of JSON.parse(row.tags)) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);

  const moodRows = db.prepare("SELECT mood, COUNT(*) as c FROM clips WHERE mood IS NOT NULL AND archived = 0 GROUP BY mood ORDER BY c DESC LIMIT 5").all() as any[];

  const typeRows = db.prepare("SELECT type, COUNT(*) as c FROM clips WHERE archived = 0 GROUP BY type ORDER BY c DESC").all() as any[];

  const appRows = db.prepare("SELECT source_app, COUNT(*) as c FROM clips WHERE source_app IS NOT NULL AND archived = 0 GROUP BY source_app ORDER BY c DESC LIMIT 5").all() as any[];

  let profile = "";
  if (topTags.length > 0) profile += `Haeufige Themen: ${topTags.map(([t, c]) => `${t}(${c})`).join(", ")}\n`;
  if (moodRows.length > 0) profile += `Typische Stimmungen: ${moodRows.map((m: any) => `${m.mood}(${m.c})`).join(", ")}\n`;
  if (typeRows.length > 0) profile += `Clip-Typen: ${typeRows.map((t: any) => `${t.type}(${t.c})`).join(", ")}\n`;
  if (appRows.length > 0) profile += `Meistgenutzte Apps: ${appRows.map((a: any) => `${a.source_app}(${a.c})`).join(", ")}\n`;
  return profile;
}

// Learning: track which replies the user actually copies (to learn their style)
export function getUsedReplyStyles(): string {
  // Look for clips that were likely replies (short text, after a message was detected)
  const rows = db.prepare(
    `SELECT content FROM clips WHERE type = 'text' AND length(content) < 500 AND length(content) > 20 AND archived = 0 ORDER BY created_at DESC LIMIT 20`
  ).all() as any[];
  if (rows.length === 0) return "";
  return rows.map((r: any) => r.content).join("\n---\n");
}

// Clear all clips (panic button)
export function clearAllClips() {
  db.prepare("DELETE FROM clips").run();
}

// Chat messages
export function getChatMessages(limit = 100): { id: number; role: string; text: string; createdAt: string }[] {
  return (db.prepare("SELECT * FROM chat_messages ORDER BY id DESC LIMIT ?").all(limit) as any[])
    .reverse()
    .map(r => ({ id: r.id, role: r.role, text: r.text, createdAt: r.created_at }));
}

export function addChatMessage(role: string, text: string) {
  db.prepare("INSERT INTO chat_messages (role, text, created_at) VALUES (?, ?, ?)").run(role, text, new Date().toISOString());
}

export function clearChatHistory() {
  db.prepare("DELETE FROM chat_messages").run();
}

// Import clips (skip duplicates by content_hash)
export function importClips(clips: any[]): number {
  let imported = 0;
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO clips (id, type, content, content_hash, summary, tags, mood, actions, sensitivity, source_app, pinned, archived, enriched, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const clip of clips) {
      const result = stmt.run(
        clip.id || crypto.randomUUID(),
        clip.type || "text",
        clip.content || "",
        clip.contentHash || clip.content_hash || "",
        clip.summary || null,
        typeof clip.tags === "string" ? clip.tags : JSON.stringify(clip.tags || []),
        clip.mood || null,
        typeof clip.actions === "string" ? clip.actions : JSON.stringify(clip.actions || []),
        clip.sensitivity || null,
        clip.sourceApp || clip.source_app || null,
        clip.pinned ? 1 : 0,
        clip.archived ? 1 : 0,
        clip.enriched ? 1 : 0,
        clip.createdAt || clip.created_at || new Date().toISOString(),
      );
      if (result.changes > 0) imported++;
    }
  });
  tx();
  return imported;
}

// Templates
export function getTemplates(): any[] {
  return (db.prepare("SELECT * FROM templates ORDER BY use_count DESC, created_at DESC").all() as any[]).map(r => ({
    id: r.id, name: r.name, content: r.content, category: r.category,
    variables: JSON.parse(r.variables || "[]"), useCount: r.use_count, createdAt: r.created_at,
  }));
}

export function createTemplate(id: string, name: string, content: string, category: string) {
  // Auto-detect variables like {name}, {thema}, etc.
  const vars = [...content.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
  db.prepare("INSERT INTO templates (id, name, content, category, variables, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
    id, name, content, category, JSON.stringify(vars), new Date().toISOString(),
  );
}

export function updateTemplate(id: string, name: string, content: string, category: string): number {
  // Re-detect variables after content change
  const vars = [...content.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
  const result = db.prepare("UPDATE templates SET name = ?, content = ?, category = ?, variables = ? WHERE id = ?").run(
    name, content, category, JSON.stringify(vars), id,
  );
  return result.changes;
}

export function deleteTemplate(id: string) {
  db.prepare("DELETE FROM templates WHERE id = ?").run(id);
}

export function incrementTemplateUse(id: string) {
  db.prepare("UPDATE templates SET use_count = use_count + 1 WHERE id = ?").run(id);
}

// Clipboard Rules
export function getRules(): any[] {
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS clipboard_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      condition_type TEXT NOT NULL,
      condition_value TEXT NOT NULL,
      action_type TEXT NOT NULL,
      action_value TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    )`);
  } catch {}
  return (db.prepare("SELECT * FROM clipboard_rules ORDER BY created_at DESC").all() as any[]).map(r => ({
    id: r.id, name: r.name, conditionType: r.condition_type, conditionValue: r.condition_value,
    actionType: r.action_type, actionValue: r.action_value, enabled: !!r.enabled, createdAt: r.created_at,
  }));
}

export function createRule(id: string, name: string, conditionType: string, conditionValue: string, actionType: string, actionValue: string) {
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS clipboard_rules (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, condition_type TEXT NOT NULL, condition_value TEXT NOT NULL,
      action_type TEXT NOT NULL, action_value TEXT NOT NULL, enabled INTEGER DEFAULT 1, created_at TEXT NOT NULL
    )`);
  } catch {}
  db.prepare("INSERT INTO clipboard_rules (id, name, condition_type, condition_value, action_type, action_value, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    id, name, conditionType, conditionValue, actionType, actionValue, new Date().toISOString(),
  );
}

export function deleteRule(id: string) {
  db.prepare("DELETE FROM clipboard_rules WHERE id = ?").run(id);
}

export function toggleRule(id: string) {
  db.prepare("UPDATE clipboard_rules SET enabled = CASE WHEN enabled = 1 THEN 0 ELSE 1 END WHERE id = ?").run(id);
}

// Predictive paste: record a paste sequence (clipA was followed by clipB)
export function recordPasteSequence(clipId: string, nextClipId: string, sourceApp: string | null) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO paste_sequences (clip_id, next_clip_id, source_app, count, last_used)
    VALUES (?, ?, ?, 1, ?)
    ON CONFLICT(clip_id, next_clip_id)
    DO UPDATE SET count = count + 1, last_used = ?, source_app = COALESCE(?, source_app)
  `).run(clipId, nextClipId, sourceApp, now, now, sourceApp);
}

// Predictive paste: record hourly usage pattern
export function recordHourlyPattern(clipId: string, hour: number) {
  db.prepare(`
    INSERT INTO hourly_patterns (clip_id, hour, count)
    VALUES (?, ?, 1)
    ON CONFLICT(clip_id, hour)
    DO UPDATE SET count = count + 1
  `).run(clipId, hour);
}

// Predictive paste: get all paste sequences
export function getPasteSequences(): { clipId: string; nextClipId: string; sourceApp: string | null; count: number; lastUsed: string }[] {
  return (db.prepare("SELECT * FROM paste_sequences ORDER BY count DESC LIMIT 500").all() as any[]).map(r => ({
    clipId: r.clip_id,
    nextClipId: r.next_clip_id,
    sourceApp: r.source_app,
    count: r.count,
    lastUsed: r.last_used,
  }));
}

// Predictive paste: get hourly patterns
export function getHourlyPatterns(): { clipId: string; hour: number; count: number }[] {
  return (db.prepare("SELECT * FROM hourly_patterns ORDER BY count DESC LIMIT 500").all() as any[]).map(r => ({
    clipId: r.clip_id,
    hour: r.hour,
    count: r.count,
  }));
}

// Predictive paste: get recent clips with prediction-relevant fields
export function getRecentClipsForPrediction(limit = 50): { id: string; content: string; summary: string | null; tags: string[]; sourceApp: string | null; type: string; createdAt: string }[] {
  const rows = db.prepare("SELECT id, content, summary, tags, source_app, type, created_at FROM clips WHERE archived = 0 ORDER BY created_at DESC LIMIT ?").all(limit) as any[];
  return rows.map(r => ({
    id: r.id,
    content: r.content,
    summary: r.summary,
    tags: JSON.parse(r.tags || "[]"),
    sourceApp: r.source_app,
    type: r.type,
    createdAt: r.created_at,
  }));
}


// Clipboard chains: save a detected chain as a collection
export function saveChainAsCollection(id: string, name: string, clipIds: string[], chainType: string) {
  const icon = chainType === "template" ? "📋" : chainType === "collection" ? "📚" : "🔗";
  db.prepare("INSERT INTO collections (id, name, icon, clip_ids, created_at) VALUES (?, ?, ?, ?, ?)").run(
    id, name, icon, JSON.stringify(clipIds), new Date().toISOString(),
  );
}

// Clipboard chains: get clips by IDs in order
export function getClipsByIds(ids: string[]): any[] {
  if (ids.length === 0) return [];
  const capped = ids.slice(0, 100);
  const placeholders = capped.map(() => "?").join(",");
  const rows = db.prepare(`SELECT * FROM clips WHERE id IN (${placeholders})`).all(...capped) as ClipRow[];
  const clipMap = new Map(rows.map(r => [r.id, rowToClip(r)]));
  // Return in the order of the input IDs
  return capped.map(id => clipMap.get(id)).filter(Boolean);
}

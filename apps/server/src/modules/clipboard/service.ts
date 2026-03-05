import { pool } from "../../database/connection";

export interface CreateClipInput {
  userId: string;
  deviceId: string;
  type: "text" | "image" | "file" | "url";
  contentEnc: string; // base64
  previewEnc: string | null;
  contentHash: string;
  sourceApp: string | null;
  tags: string[];
  summary: string | null;
  mood: string | null;
  actions: any[];
  sensitivity: string | null;
  autoExpire: string | null; // ISO date
  aiRaw: Record<string, unknown> | null;
  embedding?: number[]; // 1536-dim vector
}

export async function createClip(input: CreateClipInput) {
  const embeddingStr = input.embedding ? `[${input.embedding.join(",")}]` : null;

  const result = await pool.query(
    `INSERT INTO clips (
      user_id, device_id, type, content_enc, preview_enc, content_hash,
      source_app, tags, summary, mood, actions, sensitivity, auto_expire, ai_raw, embedding
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *`,
    [
      input.userId, input.deviceId, input.type,
      Buffer.from(input.contentEnc, "base64"),
      input.previewEnc ? Buffer.from(input.previewEnc, "base64") : null,
      input.contentHash, input.sourceApp, input.tags,
      input.summary, input.mood, JSON.stringify(input.actions),
      input.sensitivity,
      input.autoExpire ? new Date(input.autoExpire) : null,
      input.aiRaw ? JSON.stringify(input.aiRaw) : null,
      embeddingStr,
    ]
  );
  return formatClip(result.rows[0]);
}

export async function getClips(userId: string, options: {
  limit?: number;
  offset?: number;
  type?: string;
  tags?: string[];
  pinned?: boolean;
  archived?: boolean;
  search?: string;
  deviceId?: string;
}) {
  const conditions = ["user_id = $1"];
  const params: any[] = [userId];
  let paramIndex = 2;

  if (options.type) {
    conditions.push(`type = $${paramIndex++}`);
    params.push(options.type);
  }
  if (options.tags && options.tags.length > 0) {
    conditions.push(`tags && $${paramIndex++}`);
    params.push(options.tags);
  }
  if (options.pinned !== undefined) {
    conditions.push(`pinned = $${paramIndex++}`);
    params.push(options.pinned);
  }
  if (options.archived !== undefined) {
    conditions.push(`archived = $${paramIndex++}`);
    params.push(options.archived);
  }
  if (options.deviceId) {
    conditions.push(`device_id = $${paramIndex++}`);
    params.push(options.deviceId);
  }
  if (options.search) {
    conditions.push(`(summary ILIKE $${paramIndex} OR array_to_string(tags, ' ') ILIKE $${paramIndex})`);
    params.push(`%${options.search}%`);
    paramIndex++;
  }

  // Exclude expired clips
  conditions.push(`(expires_at IS NULL OR expires_at > NOW())`);

  const limit = options.limit || 50;
  const offset = options.offset || 0;

  const query = `
    SELECT * FROM clips
    WHERE ${conditions.join(" AND ")}
    ORDER BY pinned DESC, created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count (all params except limit/offset)
  const countQuery = `SELECT COUNT(*) FROM clips WHERE ${conditions.join(" AND ")}`;
  const countResult = await pool.query(countQuery, params.slice(0, -2));

  return {
    clips: result.rows.map(formatClip),
    total: parseInt(countResult.rows[0].count),
    limit,
    offset,
  };
}

export async function getClipById(clipId: string, userId: string) {
  const result = await pool.query(
    "SELECT * FROM clips WHERE id = $1 AND user_id = $2",
    [clipId, userId]
  );
  if (result.rows.length === 0) return null;
  return formatClip(result.rows[0]);
}

export async function updateClip(clipId: string, userId: string, updates: {
  pinned?: boolean;
  archived?: boolean;
  tags?: string[];
  summary?: string;
  mood?: string;
  expiresAt?: string | null;
}) {
  const setClauses: string[] = ["updated_at = NOW()"];
  const params: any[] = [];
  let paramIndex = 1;

  if (updates.pinned !== undefined) {
    setClauses.push(`pinned = $${paramIndex++}`);
    params.push(updates.pinned);
  }
  if (updates.archived !== undefined) {
    setClauses.push(`archived = $${paramIndex++}`);
    params.push(updates.archived);
  }
  if (updates.tags !== undefined) {
    setClauses.push(`tags = $${paramIndex++}`);
    params.push(updates.tags);
  }
  if (updates.summary !== undefined) {
    setClauses.push(`summary = $${paramIndex++}`);
    params.push(updates.summary);
  }
  if (updates.mood !== undefined) {
    setClauses.push(`mood = $${paramIndex++}`);
    params.push(updates.mood);
  }
  if (updates.expiresAt !== undefined) {
    setClauses.push(`expires_at = $${paramIndex++}`);
    params.push(updates.expiresAt ? new Date(updates.expiresAt) : null);
  }

  const result = await pool.query(
    `UPDATE clips SET ${setClauses.join(", ")} WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`,
    [...params, clipId, userId]
  );
  if (result.rows.length === 0) return null;
  return formatClip(result.rows[0]);
}

export async function deleteClip(clipId: string, userId: string) {
  const result = await pool.query(
    "DELETE FROM clips WHERE id = $1 AND user_id = $2 RETURNING id",
    [clipId, userId]
  );
  return result.rows.length > 0;
}

export async function checkDedup(userId: string, contentHash: string) {
  const result = await pool.query(
    "SELECT id FROM clips WHERE user_id = $1 AND content_hash = $2 AND created_at > NOW() - INTERVAL '5 seconds'",
    [userId, contentHash]
  );
  return result.rows.length > 0;
}

export async function semanticSearch(userId: string, queryEmbedding: number[], limit: number = 10) {
  const embeddingStr = `[${queryEmbedding.join(",")}]`;
  const result = await pool.query(
    `SELECT *, 1 - (embedding <=> $1::vector) as similarity
     FROM clips
     WHERE user_id = $2 AND embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    [embeddingStr, userId, limit]
  );
  return result.rows.map(row => ({
    ...formatClip(row),
    similarity: parseFloat(row.similarity),
  }));
}

export async function getClipStats(userId: string) {
  const result = await pool.query(
    `SELECT
       COUNT(*) as total_clips,
       COUNT(*) FILTER (WHERE type = 'text') as text_clips,
       COUNT(*) FILTER (WHERE type = 'image') as image_clips,
       COUNT(*) FILTER (WHERE type = 'url') as url_clips,
       COUNT(*) FILTER (WHERE type = 'file') as file_clips,
       COUNT(*) FILTER (WHERE pinned = true) as pinned_clips,
       COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as clips_this_week
     FROM clips WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

function formatClip(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    deviceId: row.device_id,
    type: row.type,
    contentEnc: row.content_enc?.toString("base64"),
    previewEnc: row.preview_enc?.toString("base64") || null,
    contentHash: row.content_hash,
    sourceApp: row.source_app,
    pinned: row.pinned,
    archived: row.archived,
    expiresAt: row.expires_at,
    tags: row.tags || [],
    summary: row.summary,
    mood: row.mood,
    actions: row.actions || [],
    relatedClips: row.related_clips || [],
    sensitivity: row.sensitivity,
    autoExpire: row.auto_expire,
    aiRaw: row.ai_raw,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

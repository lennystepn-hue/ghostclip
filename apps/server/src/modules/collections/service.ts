import { pool } from "../../database/connection";

export async function createCollection(userId: string, input: { name: string; icon: string; smartRule?: Record<string, unknown> | null }) {
  const result = await pool.query(
    `INSERT INTO collections (user_id, name, icon, smart_rule)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, input.name, input.icon, input.smartRule ? JSON.stringify(input.smartRule) : null]
  );
  return formatCollection(result.rows[0]);
}

export async function getCollections(userId: string) {
  const result = await pool.query(
    "SELECT * FROM collections WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return result.rows.map(formatCollection);
}

export async function getCollectionById(collectionId: string, userId: string) {
  const result = await pool.query(
    "SELECT * FROM collections WHERE id = $1 AND user_id = $2",
    [collectionId, userId]
  );
  if (result.rows.length === 0) return null;
  return formatCollection(result.rows[0]);
}

export async function updateCollection(collectionId: string, userId: string, updates: { name?: string; icon?: string; smartRule?: Record<string, unknown> | null; clipIds?: string[] }) {
  const setClauses: string[] = ["updated_at = NOW()"];
  const params: any[] = [];
  let i = 1;

  if (updates.name !== undefined) { setClauses.push(`name = $${i++}`); params.push(updates.name); }
  if (updates.icon !== undefined) { setClauses.push(`icon = $${i++}`); params.push(updates.icon); }
  if (updates.smartRule !== undefined) { setClauses.push(`smart_rule = $${i++}`); params.push(JSON.stringify(updates.smartRule)); }
  if (updates.clipIds !== undefined) { setClauses.push(`clip_ids = $${i++}`); params.push(updates.clipIds); }

  const result = await pool.query(
    `UPDATE collections SET ${setClauses.join(", ")} WHERE id = $${i++} AND user_id = $${i++} RETURNING *`,
    [...params, collectionId, userId]
  );
  if (result.rows.length === 0) return null;
  return formatCollection(result.rows[0]);
}

export async function addClipToCollection(collectionId: string, userId: string, clipId: string) {
  const result = await pool.query(
    `UPDATE collections SET clip_ids = array_append(clip_ids, $1), updated_at = NOW()
     WHERE id = $2 AND user_id = $3 AND NOT ($1 = ANY(clip_ids))
     RETURNING *`,
    [clipId, collectionId, userId]
  );
  if (result.rows.length === 0) return null;
  return formatCollection(result.rows[0]);
}

export async function removeClipFromCollection(collectionId: string, userId: string, clipId: string) {
  const result = await pool.query(
    `UPDATE collections SET clip_ids = array_remove(clip_ids, $1), updated_at = NOW()
     WHERE id = $2 AND user_id = $3 RETURNING *`,
    [clipId, collectionId, userId]
  );
  if (result.rows.length === 0) return null;
  return formatCollection(result.rows[0]);
}

export async function deleteCollection(collectionId: string, userId: string) {
  const result = await pool.query(
    "DELETE FROM collections WHERE id = $1 AND user_id = $2 RETURNING id",
    [collectionId, userId]
  );
  return result.rows.length > 0;
}

function formatCollection(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    icon: row.icon,
    smartRule: row.smart_rule,
    clipIds: row.clip_ids || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

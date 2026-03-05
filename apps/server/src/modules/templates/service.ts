import { pool } from "../../database/connection";

export async function createTemplate(userId: string, input: { name: string; template: string; context: Record<string, unknown> }) {
  const result = await pool.query(
    `INSERT INTO reply_templates (user_id, name, template, context)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, input.name, input.template, JSON.stringify(input.context)]
  );
  return formatTemplate(result.rows[0]);
}

export async function getTemplates(userId: string) {
  const result = await pool.query(
    "SELECT * FROM reply_templates WHERE user_id = $1 ORDER BY usage_count DESC, created_at DESC",
    [userId]
  );
  return result.rows.map(formatTemplate);
}

export async function getTemplateById(templateId: string, userId: string) {
  const result = await pool.query(
    "SELECT * FROM reply_templates WHERE id = $1 AND user_id = $2",
    [templateId, userId]
  );
  if (result.rows.length === 0) return null;
  return formatTemplate(result.rows[0]);
}

export async function updateTemplate(templateId: string, userId: string, updates: { name?: string; template?: string; context?: Record<string, unknown> }) {
  const setClauses: string[] = ["updated_at = NOW()"];
  const params: any[] = [];
  let i = 1;

  if (updates.name !== undefined) { setClauses.push(`name = $${i++}`); params.push(updates.name); }
  if (updates.template !== undefined) { setClauses.push(`template = $${i++}`); params.push(updates.template); }
  if (updates.context !== undefined) { setClauses.push(`context = $${i++}`); params.push(JSON.stringify(updates.context)); }

  const result = await pool.query(
    `UPDATE reply_templates SET ${setClauses.join(", ")} WHERE id = $${i++} AND user_id = $${i++} RETURNING *`,
    [...params, templateId, userId]
  );
  if (result.rows.length === 0) return null;
  return formatTemplate(result.rows[0]);
}

export async function incrementUsage(templateId: string, userId: string) {
  await pool.query(
    "UPDATE reply_templates SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = $1 AND user_id = $2",
    [templateId, userId]
  );
}

export async function deleteTemplate(templateId: string, userId: string) {
  const result = await pool.query(
    "DELETE FROM reply_templates WHERE id = $1 AND user_id = $2 RETURNING id",
    [templateId, userId]
  );
  return result.rows.length > 0;
}

function formatTemplate(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    template: row.template,
    context: row.context || {},
    usageCount: row.usage_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

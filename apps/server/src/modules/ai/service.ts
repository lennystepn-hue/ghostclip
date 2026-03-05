import { enrichClip, generateReplies, chat, analyzeImage } from "@ghostclip/ai-client";
import { generateEmbedding } from "./embedding";
import { pool } from "../../database/connection";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

export async function enrichClipContent(input: {
  type: "text" | "image" | "file" | "url";
  content: string;
  userId: string;
}) {
  // Get recent clips for context
  const recentResult = await pool.query(
    "SELECT summary, tags FROM clips WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10",
    [input.userId],
  );
  const recentContext = recentResult.rows
    .filter((r) => r.summary)
    .map((r) => `[${r.tags?.join(", ")}] ${r.summary}`)
    .join("\n");

  const enrichment = await enrichClip({
    type: input.type,
    content: input.content,
    apiKey: ANTHROPIC_API_KEY,
    recentClipsSummary: recentContext || undefined,
  });

  // Generate embedding for semantic search
  const textForEmbedding = [input.content, enrichment.summary, ...enrichment.tags].join(" ");
  const embedding = await generateEmbedding(textForEmbedding).catch(() => []);

  return { ...enrichment, embedding };
}

export async function getReplySuggestions(input: {
  message: string;
  userId: string;
  template?: string;
}) {
  // Build context from recent clips
  const recentResult = await pool.query(
    "SELECT summary, tags, mood FROM clips WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5",
    [input.userId],
  );
  const context = recentResult.rows
    .filter((r) => r.summary)
    .map((r) => `[${r.mood}] ${r.summary}`)
    .join("\n");

  return generateReplies({
    message: input.message,
    apiKey: ANTHROPIC_API_KEY,
    context: context || undefined,
    template: input.template,
  });
}

export async function chatWithClips(input: {
  message: string;
  userId: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}) {
  // Get clip metadata for context
  const clipsResult = await pool.query(
    "SELECT summary, tags, mood, type, created_at FROM clips WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
    [input.userId],
  );
  const clipContext = clipsResult.rows
    .filter((r) => r.summary)
    .map(
      (r) =>
        `[${r.created_at?.toISOString().split("T")[0]}] [${r.type}] [${r.tags?.join(", ")}] ${r.summary}`,
    )
    .join("\n");

  return chat({
    message: input.message,
    apiKey: ANTHROPIC_API_KEY,
    clipContext,
    conversationHistory: input.conversationHistory,
  });
}

export async function analyzeClipImage(input: {
  imageBase64: string;
  mediaType: "image/png" | "image/jpeg" | "image/gif" | "image/webp";
}) {
  const result = await analyzeImage({
    ...input,
    apiKey: ANTHROPIC_API_KEY,
  });

  // Generate embedding from OCR text + description
  const textForEmbedding = [result.ocrText, result.description, result.summary, ...result.tags].join(" ");
  const embedding = await generateEmbedding(textForEmbedding).catch(() => []);

  return { ...result, embedding };
}

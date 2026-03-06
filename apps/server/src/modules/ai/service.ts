import { enrichClip, generateReplies, chat, analyzeImage } from "@ghostclip/ai-client";
import { generateEmbedding } from "./embedding";
import { pool } from "../../database/connection";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

function readCredsFromKeychain(): Record<string, any> | null {
  if (process.platform !== "darwin") return null;
  try {
    const account = (process.env.USER || process.env.LOGNAME || "default").replace(/[^a-zA-Z0-9._-]/g, "");
    const raw = execSync(
      `security find-generic-password -s "Claude Code-credentials" -a "${account}" -w 2>/dev/null`,
      { encoding: "utf-8", timeout: 5000 },
    ).trim();
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Fallback: read local Claude OAuth token (same server machine)
function getOAuthToken(): string | null {
  if (ANTHROPIC_API_KEY) return null; // prefer API key
  try {
    // macOS: try Keychain first
    if (process.platform === "darwin") {
      const kc = readCredsFromKeychain();
      if (kc) {
        const oauth = kc.claudeAiOauth;
        if (oauth?.accessToken && oauth.expiresAt > Date.now()) {
          return oauth.accessToken;
        }
        return null;
      }
    }
    // Windows / Linux / fallback: read from file
    const credsPath = join(process.env.HOME || "/root", ".claude", ".credentials.json");
    const creds = JSON.parse(readFileSync(credsPath, "utf-8"));
    const oauth = creds.claudeAiOauth;
    if (oauth?.accessToken && oauth.expiresAt > Date.now()) {
      return oauth.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

function getAuthHeaders(): { apiKey?: string; oauthToken?: string } {
  if (ANTHROPIC_API_KEY) return { apiKey: ANTHROPIC_API_KEY };
  const token = getOAuthToken();
  if (token) return { oauthToken: token };
  return {};
}

export async function enrichClipContent(input: {
  type: "text" | "image" | "file" | "url";
  content: string;
  userId: string;
}) {
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
    ...getAuthHeaders(),
    recentClipsSummary: recentContext || undefined,
  });

  const textForEmbedding = [input.content, enrichment.summary, ...enrichment.tags].join(" ");
  const embedding = await generateEmbedding(textForEmbedding).catch(() => []);

  return { ...enrichment, embedding };
}

export async function getReplySuggestions(input: {
  message: string;
  userId: string;
  template?: string;
}) {
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
    ...getAuthHeaders(),
    context: context || undefined,
    template: input.template,
  });
}

export async function chatWithClips(input: {
  message: string;
  userId: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}) {
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
    ...getAuthHeaders(),
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
    ...getAuthHeaders(),
  });

  const textForEmbedding = [result.ocrText, result.description, result.summary, ...result.tags].join(" ");
  const embedding = await generateEmbedding(textForEmbedding).catch(() => []);

  return { ...result, embedding };
}

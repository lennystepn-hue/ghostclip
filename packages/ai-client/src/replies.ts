import type { ReplySuggestion } from "@ghostclip/shared";

const REPLY_PROMPT = `Du bist GhostClip Reply-Assistent. Der User hat eine Nachricht kopiert und moechte darauf antworten. Generiere 3 Antwortvorschlaege in verschiedenen Toenen.

Antworte NUR mit validem JSON:
[
  { "id": "1", "text": "Antwort...", "tone": "casual", "confidence": 0.9 },
  { "id": "2", "text": "Antwort...", "tone": "formal", "confidence": 0.85 },
  { "id": "3", "text": "Antwort...", "tone": "freundlich", "confidence": 0.8 }
]`;

interface ReplyOptions {
  message: string;
  apiKey?: string;
  oauthToken?: string;
  context?: string;
  userStyle?: string;
  template?: string;
}

export async function generateReplies(
  options: ReplyOptions,
): Promise<ReplySuggestion[]> {
  let userContent = `Nachricht:\n${options.message}`;
  if (options.context) userContent += `\n\nKontext:\n${options.context}`;
  if (options.userStyle) userContent += `\n\nUser-Stil:\n${options.userStyle}`;
  if (options.template) userContent += `\n\nTemplate:\n${options.template}`;

  const headers: Record<string, string> = {
    "content-type": "application/json",
    "anthropic-version": "2023-06-01",
  };

  if (options.oauthToken) {
    headers["Authorization"] = `Bearer ${options.oauthToken}`;
    headers["anthropic-beta"] = "oauth-2025-04-20";
  } else if (options.apiKey) {
    headers["x-api-key"] = options.apiKey;
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: REPLY_PROMPT,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status} ${err}`);
  }

  const data = await res.json();
  let text = data.content?.[0]?.type === "text" ? data.content[0].text : "[]";
  // Strip markdown code fences if present
  text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  return JSON.parse(text);
}

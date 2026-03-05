import Anthropic from "@anthropic-ai/sdk";
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
  apiKey: string;
  context?: string;
  userStyle?: string;
  template?: string;
}

export async function generateReplies(
  options: ReplyOptions,
): Promise<ReplySuggestion[]> {
  const client = new Anthropic({ apiKey: options.apiKey });

  let userContent = `Nachricht:\n${options.message}`;
  if (options.context) userContent += `\n\nKontext:\n${options.context}`;
  if (options.userStyle) userContent += `\n\nUser-Stil:\n${options.userStyle}`;
  if (options.template) userContent += `\n\nTemplate:\n${options.template}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: REPLY_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "[]";
  return JSON.parse(text);
}

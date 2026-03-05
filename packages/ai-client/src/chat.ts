import Anthropic from "@anthropic-ai/sdk";

const CHAT_SYSTEM = `Du bist GhostClip AI Chat-Assistent. Du hilfst dem User, seine Clipboard-History zu durchsuchen und zu verstehen. Du hast Zugriff auf die Metadaten (Tags, Summaries, Moods) der Clips des Users.

Beantworte Fragen natuerlich und hilfreich. Wenn du Clips referenzierst, nenne die Summary und Tags.`;

interface ChatOptions {
  message: string;
  apiKey: string;
  clipContext: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}

export async function chat(options: ChatOptions): Promise<string> {
  const client = new Anthropic({ apiKey: options.apiKey });

  const messages = [
    ...options.conversationHistory,
    { role: "user" as const, content: options.message },
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: `${CHAT_SYSTEM}\n\nClipboard-Kontext des Users:\n${options.clipContext}`,
    messages,
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

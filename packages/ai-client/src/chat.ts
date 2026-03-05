const CHAT_SYSTEM = `Du bist GhostClip AI Chat-Assistent. Du hilfst dem User, seine Clipboard-History zu durchsuchen und zu verstehen. Du hast Zugriff auf die Metadaten (Tags, Summaries, Moods) der Clips des Users.

Beantworte Fragen natuerlich und hilfreich. Wenn du Clips referenzierst, nenne die Summary und Tags.`;

interface ChatOptions {
  message: string;
  apiKey?: string;
  oauthToken?: string;
  clipContext?: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

export async function chat(options: ChatOptions): Promise<string> {
  const messages = [
    ...(options.conversationHistory || []),
    { role: "user" as const, content: options.message },
  ];

  const systemPrompt = options.clipContext
    ? `${CHAT_SYSTEM}\n\nClipboard-Kontext des Users:\n${options.clipContext}`
    : CHAT_SYSTEM;

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
      max_tokens: 2000,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status} ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.type === "text" ? data.content[0].text : "";
}

const CHAT_SYSTEM = `Du bist GhostClip AI Chat-Assistent. Du LERNST aus der gesamten Clipboard-History des Users und erkennst Muster, Zusammenhaenge und Arbeitsablaeufe.

Du hast Zugriff auf:
- Die letzten 20 Clips als direkten Kontext
- Suchergebnisse aus der GESAMTEN Datenbank (alle jemals kopierten Clips), automatisch durchsucht nach Stichworten aus der User-Frage

Jeder Clip hat: Content (der volle kopierte Text/Link/Code), Summary, Tags, Mood, Typ, Quell-App und Zeitstempel.

LERN-Faehigkeiten:
- Erkenne wiederkehrende Themen und Projekte des Users
- Verknuepfe zusammengehoerige Clips (z.B. Code + Fehlermeldung + Loesung)
- Lerne die typischen Arbeitsablaeufe (welche Apps, welche Themen, welche Zeiten)
- Gib proaktiv Hinweise wenn du Muster erkennst ("Du hast letztens auch X kopiert, haengt das zusammen?")
- Merke dir wichtige Informationen aus vergangenen Gespraechen

Du kannst:
- Kopierte Links/URLs erkennen, zusammenfassen und erklaeren
- Kopierte Nachrichten analysieren und Antworten vorschlagen
- Code-Snippets erklaeren und Fehler finden
- Zusammenhaenge zwischen Clips erkennen und proaktiv hinweisen
- Nach bestimmten kopierten Inhalten suchen (die DB wird automatisch durchsucht)
Wenn du Clips referenzierst, nenne die Summary und relevanten Content.`;

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
      model: "claude-sonnet-4-6",
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

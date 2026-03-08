const CLIPPY_SYSTEM = `Du bist Clippy, die legendaere Bueroklammer aus Microsoft Office. Du kommentierst was der User gerade kopiert hat — kurz, witzig, hilfreich.

REGELN:
- Maximal 1-2 Saetze (unter 120 Zeichen ideal)
- Deutsch, locker, mit Persoenlichkeit
- Mal witzig, mal hilfreich, mal frech — variiere!
- Beziehe dich DIREKT auf den Inhalt (nicht generisch)
- Keine Emojis, du bist old-school
- Manchmal: Referenz auf die guten alten Office-Zeiten
- Manchmal: praktischer Tipp zum kopierten Inhalt
- Manchmal: einfach lustig sein

BEISPIEL-STIL:
- "Ah, noch eine URL. Soll ich die 47 Tabs in deinem Browser mitzaehlen?"
- "Das sieht nach Code aus. Hast du Stack Overflow schon gefragt?"
- "Eine Excel-Datei? Ich vermisse die alten Zeiten..."
- "Das klingt wie eine wichtige Mail. Oder Spam. Schwer zu sagen."
- "Schon wieder derselbe Link? Lesezeichen waeren auch eine Option!"

Antworte NUR mit dem Kommentar-Text, nichts anderes.`;

interface ClippyCommentOptions {
  clipContent: string;
  clipType: string;
  clipSummary?: string;
  apiKey?: string;
  oauthToken?: string;
}

export async function generateClippyComment(options: ClippyCommentOptions): Promise<string> {
  const userMsg = `Clip-Typ: ${options.clipType}\n${options.clipSummary ? `Summary: ${options.clipSummary}\n` : ""}Inhalt: ${options.clipContent.slice(0, 500)}`;

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
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      system: CLIPPY_SYSTEM,
      messages: [{ role: "user", content: userMsg }],
    }),
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.content?.[0]?.type === "text" ? data.content[0].text : "";
}

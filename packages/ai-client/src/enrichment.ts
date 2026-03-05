import type { AiEnrichmentResult, ClipAction } from "@ghostclip/shared";

const ENRICHMENT_PROMPT = `Du bist GhostClip, ein AI-Clipboard-Assistent. Analysiere den folgenden Clipboard-Inhalt und liefere eine JSON-Antwort.

Regeln:
- Tags: Frei generiert, unbegrenzt, was relevant ist
- Summary: Kurze Zusammenfassung (max 100 Zeichen)
- Mood: Frei (geschaeftlich, privat, kreativ, dringend, etc.)
- Actions: Kontextbezogene Vorschlaege was der User damit tun koennte
- Sensitivity: Wie sensibel ist der Inhalt (low/medium/high/critical)
- AutoExpire: ISO timestamp wenn der Inhalt automatisch ablaufen sollte (Passwoerter, Tokens), sonst null

Antworte NUR mit validem JSON:
{
  "tags": ["tag1", "tag2"],
  "summary": "Kurze Zusammenfassung",
  "mood": "stimmung",
  "actions": [{ "label": "Aktion?", "type": "suggestion", "payload": {} }],
  "relatedTo": [],
  "sensitivity": "low|medium|high|critical",
  "autoExpire": null
}`;

interface EnrichClipOptions {
  type: "text" | "image" | "file" | "url";
  content: string;
  apiKey?: string;
  oauthToken?: string;
  recentClipsSummary?: string;
}

export async function enrichClip(
  options: EnrichClipOptions,
): Promise<AiEnrichmentResult> {
  const userContent = options.recentClipsSummary
    ? `Clipboard-Inhalt (${options.type}):\n${options.content}\n\nLetzte Clips als Kontext:\n${options.recentClipsSummary}`
    : `Clipboard-Inhalt (${options.type}):\n${options.content}`;

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
      max_tokens: 500,
      system: ENRICHMENT_PROMPT,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status} ${err}`);
  }

  const data = await res.json();
  let text = data.content?.[0]?.type === "text" ? data.content[0].text : "";
  // Strip markdown code fences if present
  text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  const parsed = JSON.parse(text);

  return {
    tags: parsed.tags ?? [],
    summary: parsed.summary ?? "",
    mood: parsed.mood ?? "neutral",
    actions: (parsed.actions ?? []) as ClipAction[],
    relatedTo: parsed.relatedTo ?? [],
    sensitivity: parsed.sensitivity ?? "low",
    autoExpire: parsed.autoExpire ? new Date(parsed.autoExpire) : null,
  };
}

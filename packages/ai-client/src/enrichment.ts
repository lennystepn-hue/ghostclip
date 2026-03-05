import Anthropic from "@anthropic-ai/sdk";
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
  "actions": [{ "label": "Aktion?", "type": "suggestion|reminder|link|template", "payload": {} }],
  "relatedTo": [],
  "sensitivity": "low|medium|high|critical",
  "autoExpire": null
}`;

interface EnrichClipOptions {
  type: "text" | "image" | "file" | "url";
  content: string;
  apiKey: string;
  recentClipsSummary?: string;
}

export async function enrichClip(
  options: EnrichClipOptions,
): Promise<AiEnrichmentResult> {
  const client = new Anthropic({ apiKey: options.apiKey });

  const userContent = options.recentClipsSummary
    ? `Clipboard-Inhalt (${options.type}):\n${options.content}\n\nLetzte Clips als Kontext:\n${options.recentClipsSummary}`
    : `Clipboard-Inhalt (${options.type}):\n${options.content}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: ENRICHMENT_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
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

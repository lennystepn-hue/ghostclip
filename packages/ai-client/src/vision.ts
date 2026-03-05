import type { AiEnrichmentResult } from "@ghostclip/shared";

const VISION_PROMPT = `Du bist GhostClip Vision. Analysiere dieses Bild und liefere:
1. OCR: Extrahiere allen sichtbaren Text
2. Beschreibung: Was ist auf dem Bild zu sehen?
3. Klassifizierung: tags, summary, mood, actions, sensitivity

Antworte NUR mit validem JSON:
{
  "ocrText": "extrahierter text...",
  "description": "Was ist zu sehen",
  "tags": [],
  "summary": "",
  "mood": "",
  "actions": [],
  "relatedTo": [],
  "sensitivity": "low",
  "autoExpire": null
}`;

interface VisionOptions {
  imageBase64: string;
  mediaType?: "image/png" | "image/jpeg" | "image/gif" | "image/webp";
  apiKey?: string;
  oauthToken?: string;
}

interface VisionResult extends AiEnrichmentResult {
  ocrText: string;
  description: string;
}

export async function analyzeImage(
  options: VisionOptions,
): Promise<VisionResult> {
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
      max_tokens: 1000,
      system: VISION_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: options.mediaType || "image/png",
                data: options.imageBase64,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status} ${err}`);
  }

  const data = await res.json();
  let text = data.content?.[0]?.type === "text" ? data.content[0].text : "{}";
  // Strip markdown code fences if present
  text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  const parsed = JSON.parse(text);

  return {
    ocrText: parsed.ocrText ?? "",
    description: parsed.description ?? "",
    tags: parsed.tags ?? [],
    summary: parsed.summary ?? "",
    mood: parsed.mood ?? "neutral",
    actions: parsed.actions ?? [],
    relatedTo: parsed.relatedTo ?? [],
    sensitivity: parsed.sensitivity ?? "low",
    autoExpire: parsed.autoExpire ? new Date(parsed.autoExpire) : null,
  };
}

import Anthropic from "@anthropic-ai/sdk";
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
  mediaType: "image/png" | "image/jpeg" | "image/gif" | "image/webp";
  apiKey: string;
}

interface VisionResult extends AiEnrichmentResult {
  ocrText: string;
  description: string;
}

export async function analyzeImage(
  options: VisionOptions,
): Promise<VisionResult> {
  const client = new Anthropic({ apiKey: options.apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
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
              media_type: options.mediaType,
              data: options.imageBase64,
            },
          },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "{}";
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

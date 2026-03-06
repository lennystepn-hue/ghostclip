/**
 * AI Text Transformation — rewrite, translate, shorten, formalize, etc.
 */

type TransformMode = "shorter" | "longer" | "formal" | "casual" | "translate_en" | "translate_de" | "fix_grammar" | "summarize" | "explain" | "custom";

interface TransformOptions {
  content: string;
  mode: TransformMode;
  customInstruction?: string;
  apiKey?: string;
  oauthToken?: string;
}

const TRANSFORM_PROMPTS: Record<TransformMode, string> = {
  shorter: "Kuerze den folgenden Text auf das Wesentliche. Behalte den Kern und Ton bei, entferne Fuellwoerter und Redundanz.",
  longer: "Erweitere den folgenden Text mit mehr Details und Kontext. Behalte den Ton bei.",
  formal: "Schreibe den folgenden Text in einem formellen, professionellen Ton um. Behalte den Inhalt bei.",
  casual: "Schreibe den folgenden Text in einem lockeren, freundlichen Ton um. Behalte den Inhalt bei.",
  translate_en: "Translate the following text to English. Keep the meaning and tone intact. Only output the translation, nothing else.",
  translate_de: "Uebersetze den folgenden Text ins Deutsche. Behalte Bedeutung und Ton bei. Gib nur die Uebersetzung aus, nichts anderes.",
  fix_grammar: "Korrigiere Grammatik und Rechtschreibung im folgenden Text. Aendere so wenig wie moeglich, nur Fehler beheben.",
  summarize: "Fasse den folgenden Text in 2-3 Saetzen zusammen.",
  explain: "Erklaere den folgenden Text/Code einfach und verstaendlich. Was macht er? Was ist der Zweck?",
  custom: "", // Will use customInstruction
};

export async function transformText(options: TransformOptions): Promise<string> {
  const instruction = options.mode === "custom" && options.customInstruction
    ? options.customInstruction
    : TRANSFORM_PROMPTS[options.mode];

  if (!instruction) throw new Error("No instruction for transform mode: " + options.mode);

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
      max_tokens: 2000,
      system: "Du bist ein praeziser Text-Transformer. Fuehre die gegebene Anweisung aus und gib NUR den transformierten Text zurueck — keine Erklaerungen, keine Anmerkungen, kein Markdown-Wrapper.",
      messages: [{ role: "user", content: `${instruction}\n\n---\n${options.content}` }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status} ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.type === "text" ? data.content[0].text : "";
}

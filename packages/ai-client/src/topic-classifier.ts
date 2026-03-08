const TOPIC_CLASSIFICATION_PROMPT = `You are GhostClip's topic classifier. Given clipboard content, assign it to the most relevant topic.

You will receive:
1. The clipboard content (text, code, URL, or file)
2. A list of existing topics (may be empty)
3. Tags and summary from enrichment

Rules:
- If the content fits an existing topic, use that exact topic name
- If no existing topic fits well, create a new descriptive topic name
- Topic names should be short (2-4 words), descriptive, and groupable
- Examples: "React Development", "Meeting Notes", "API Credentials", "Email Templates", "Database Queries", "Project Setup"
- Only assign if confidence >= 0.7
- Mark sensitive content topics appropriately (e.g., "API Credentials", "Passwords")

Respond ONLY with valid JSON:
{
  "topicName": "Topic Name",
  "topicDescription": "Brief description of what this topic contains",
  "topicIcon": "emoji icon",
  "confidence": 0.85,
  "isNew": true
}`;

interface ClassifyOptions {
  content: string;
  tags: string[];
  summary: string;
  type: string;
  existingTopics: string[];
  apiKey?: string;
  oauthToken?: string;
}

export interface TopicClassificationResult {
  topicName: string;
  topicDescription: string;
  topicIcon: string;
  confidence: number;
  isNew: boolean;
}

export async function classifyClipTopic(
  options: ClassifyOptions,
): Promise<TopicClassificationResult | null> {
  const userContent = [
    `Content type: ${options.type}`,
    `Tags: ${options.tags.join(", ") || "none"}`,
    `Summary: ${options.summary || "none"}`,
    `Existing topics: ${options.existingTopics.length > 0 ? options.existingTopics.join(", ") : "none yet"}`,
    `\nContent:\n${options.content}`,
  ].join("\n");

  const headers: Record<string, string> = {
    "content-type": "application/json",
    "anthropic-version": "2023-06-01",
  };

  if (options.oauthToken) {
    headers["Authorization"] = `Bearer ${options.oauthToken}`;
    headers["anthropic-beta"] = "oauth-2025-04-20";
  } else if (options.apiKey) {
    headers["x-api-key"] = options.apiKey;
  } else {
    return null;
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: TOPIC_CLASSIFICATION_PROMPT,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Topic classification ${res.status}: ${err}`);
  }

  const data = await res.json();
  let text = data.content?.[0]?.type === "text" ? data.content[0].text : "";
  text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

  try {
    const parsed = JSON.parse(text);
    if (!parsed.topicName || typeof parsed.confidence !== "number") return null;
    return {
      topicName: parsed.topicName,
      topicDescription: parsed.topicDescription || "",
      topicIcon: parsed.topicIcon || "📂",
      confidence: parsed.confidence,
      isNew: parsed.isNew ?? true,
    };
  } catch {
    console.error("[TopicClassifier] Failed to parse response:", text);
    return null;
  }
}

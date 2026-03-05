import { describe, it, expect, vi } from "vitest";
import { generateReplies } from "../replies";

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify([
              {
                id: "1",
                text: "Hey, klar mach ich!",
                tone: "casual",
                confidence: 0.9,
              },
              {
                id: "2",
                text: "Sehr gerne, ich kuemmere mich darum.",
                tone: "formal",
                confidence: 0.85,
              },
              {
                id: "3",
                text: "Na logo, wird erledigt!",
                tone: "freundlich",
                confidence: 0.8,
              },
            ]),
          },
        ],
      }),
    };
  },
}));

describe("generateReplies", () => {
  it("returns 3 reply suggestions", async () => {
    const result = await generateReplies({
      message: "Kannst du das bis morgen fertig machen?",
      apiKey: "test-key",
    });
    expect(result).toHaveLength(3);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("text");
    expect(result[0]).toHaveProperty("tone");
    expect(result[0]).toHaveProperty("confidence");
  });

  it("returns suggestions with different tones", async () => {
    const result = await generateReplies({
      message: "Meeting um 15 Uhr?",
      apiKey: "test-key",
    });
    const tones = result.map((r) => r.tone);
    expect(new Set(tones).size).toBe(3);
  });

  it("accepts optional context and style", async () => {
    const result = await generateReplies({
      message: "Wie laueft das Projekt?",
      apiKey: "test-key",
      context: "Teamleiter fragt nach Status",
      userStyle: "locker, mit Emojis",
    });
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});

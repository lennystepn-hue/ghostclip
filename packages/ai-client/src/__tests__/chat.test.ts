import { describe, it, expect, vi } from "vitest";
import { chat } from "../chat";

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: "text",
            text: "Du hast gestern 3 Clips zum Thema 'Rechnungen' kopiert. Der letzte war eine Vodafone-Rechnung ueber 47.99 EUR.",
          },
        ],
      }),
    };
  },
}));

describe("chat", () => {
  it("returns a chat response", async () => {
    const result = await chat({
      message: "Was habe ich gestern kopiert?",
      apiKey: "test-key",
      clipContext: "Clip 1: Vodafone Rechnung, Tags: rechnung, vodafone",
      conversationHistory: [],
    });
    expect(result).toContain("Vodafone");
    expect(typeof result).toBe("string");
  });

  it("accepts conversation history", async () => {
    const result = await chat({
      message: "Und was war davor?",
      apiKey: "test-key",
      clipContext: "Clip 1: Test",
      conversationHistory: [
        { role: "user", content: "Was habe ich kopiert?" },
        { role: "assistant", content: "Du hast einen Test-Clip kopiert." },
      ],
    });
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});

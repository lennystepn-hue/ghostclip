import { describe, it, expect, vi } from "vitest";
import { enrichClip } from "../enrichment";

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              tags: ["rechnung", "vodafone", "47.99"],
              summary: "Vodafone-Rechnung Maerz, 47.99 EUR",
              mood: "geschaeftlich",
              actions: [
                {
                  label: "Erinnerung setzen?",
                  type: "reminder",
                  payload: {},
                },
              ],
              relatedTo: [],
              sensitivity: "medium",
              autoExpire: null,
            }),
          },
        ],
      }),
    };
  },
}));

describe("enrichClip", () => {
  it("returns AI enrichment result", async () => {
    const result = await enrichClip({
      type: "text",
      content: "Ihre Vodafone Rechnung: 47.99 EUR",
      apiKey: "test-key",
    });
    expect(result.tags).toContain("rechnung");
    expect(result.summary).toBeDefined();
    expect(result.mood).toBeDefined();
    expect(result.actions).toBeInstanceOf(Array);
    expect(result.sensitivity).toBe("medium");
  });

  it("handles enrichment with recent clips context", async () => {
    const result = await enrichClip({
      type: "text",
      content: "test content",
      apiKey: "test-key",
      recentClipsSummary: "Previous clip about budget",
    });
    expect(result).toBeDefined();
    expect(result.tags).toBeInstanceOf(Array);
  });

  it("returns correct action structure", async () => {
    const result = await enrichClip({
      type: "url",
      content: "https://example.com",
      apiKey: "test-key",
    });
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.actions[0]).toHaveProperty("label");
    expect(result.actions[0]).toHaveProperty("type");
    expect(result.actions[0]).toHaveProperty("payload");
  });
});

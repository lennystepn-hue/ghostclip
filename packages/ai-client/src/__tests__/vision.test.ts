import { describe, it, expect, vi } from "vitest";
import { analyzeImage } from "../vision";

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ocrText: "Invoice #12345\nTotal: 99.99 EUR",
              description: "Screenshot einer Rechnung mit Tabelle",
              tags: ["screenshot", "rechnung", "invoice"],
              summary: "Rechnung #12345, Gesamt 99.99 EUR",
              mood: "geschaeftlich",
              actions: [
                { label: "Text kopieren?", type: "suggestion", payload: {} },
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

describe("analyzeImage", () => {
  it("returns vision result with OCR and description", async () => {
    const result = await analyzeImage({
      imageBase64: "iVBORw0KGgoAAAANSUhEUg==",
      mediaType: "image/png",
      apiKey: "test-key",
    });
    expect(result.ocrText).toContain("Invoice");
    expect(result.description).toBeDefined();
    expect(result.tags).toContain("screenshot");
    expect(result.summary).toBeDefined();
    expect(result.sensitivity).toBe("medium");
  });

  it("returns enrichment fields alongside vision fields", async () => {
    const result = await analyzeImage({
      imageBase64: "iVBORw0KGgoAAAANSUhEUg==",
      mediaType: "image/jpeg",
      apiKey: "test-key",
    });
    expect(result.mood).toBeDefined();
    expect(result.actions).toBeInstanceOf(Array);
    expect(result.relatedTo).toBeInstanceOf(Array);
    expect(result.autoExpire).toBeNull();
  });
});

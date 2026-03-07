import { describe, it, expect } from "vitest";
import { computePredictions, confidenceColor, confidenceLabel } from "../predictive-paste";
import type { PasteSequence, PredictionClip } from "../predictive-paste";

const makeClip = (id: string, tags: string[] = [], sourceApp: string | null = null): PredictionClip => ({
  id,
  content: `content-${id}`,
  summary: `summary-${id}`,
  tags,
  sourceApp,
  type: "text",
  createdAt: new Date().toISOString(),
});

describe("computePredictions", () => {
  it("returns empty array when no data", () => {
    const result = computePredictions({
      lastClipId: null,
      sequences: [],
      recentClips: [],
      currentApp: null,
      currentHour: 10,
      hourlyPatterns: [],
    });
    expect(result).toEqual([]);
  });

  it("predicts based on paste sequences", () => {
    const sequences: PasteSequence[] = [
      { clipId: "a", nextClipId: "b", sourceApp: null, count: 5, lastUsed: new Date().toISOString() },
      { clipId: "a", nextClipId: "c", sourceApp: null, count: 2, lastUsed: new Date().toISOString() },
    ];
    const recentClips = [makeClip("a"), makeClip("b"), makeClip("c")];

    const result = computePredictions({
      lastClipId: "a",
      sequences,
      recentClips,
      currentApp: null,
      currentHour: 10,
      hourlyPatterns: [],
    });

    expect(result.length).toBeGreaterThan(0);
    // "b" should rank higher than "c" (5 vs 2 uses)
    expect(result[0].clipId).toBe("b");
    expect(result[0].score).toBeGreaterThan(result[1]?.score || 0);
  });

  it("assigns high confidence to strong sequence patterns", () => {
    const sequences: PasteSequence[] = [
      { clipId: "a", nextClipId: "b", sourceApp: null, count: 10, lastUsed: new Date().toISOString() },
    ];
    const recentClips = [makeClip("a"), makeClip("b")];

    const result = computePredictions({
      lastClipId: "a",
      sequences,
      recentClips,
      currentApp: null,
      currentHour: 10,
      hourlyPatterns: [],
    });

    expect(result[0].confidence).toBe("high");
  });

  it("predicts based on app context", () => {
    const sequences: PasteSequence[] = [
      { clipId: "x", nextClipId: "email-clip", sourceApp: "Gmail", count: 4, lastUsed: new Date().toISOString() },
    ];
    const recentClips = [makeClip("email-clip"), makeClip("other")];

    const result = computePredictions({
      lastClipId: null,
      sequences,
      recentClips,
      currentApp: "Gmail",
      currentHour: 10,
      hourlyPatterns: [],
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].clipId).toBe("email-clip");
    expect(result[0].reason).toBe("app_context");
  });

  it("predicts based on time patterns", () => {
    const recentClips = [makeClip("standup"), makeClip("random")];

    const result = computePredictions({
      lastClipId: null,
      sequences: [],
      recentClips,
      currentApp: null,
      currentHour: 9,
      hourlyPatterns: [
        { clipId: "standup", hour: 9, count: 8 },
      ],
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].clipId).toBe("standup");
    expect(result[0].reason).toBe("time_pattern");
  });

  it("predicts based on shared tags (semantic similarity)", () => {
    const recentClips = [
      makeClip("a", ["project-x", "code"]),
      makeClip("b", ["project-x", "docs"]),
      makeClip("c", ["random"]),
    ];

    const result = computePredictions({
      lastClipId: "a",
      sequences: [],
      recentClips,
      currentApp: null,
      currentHour: 10,
      hourlyPatterns: [],
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].clipId).toBe("b");
    expect(result[0].reason).toBe("similar_tags");
  });

  it("does not predict the same clip as last pasted", () => {
    const sequences: PasteSequence[] = [
      { clipId: "a", nextClipId: "a", sourceApp: null, count: 5, lastUsed: new Date().toISOString() },
    ];
    const recentClips = [makeClip("a"), makeClip("b")];

    const result = computePredictions({
      lastClipId: "a",
      sequences,
      recentClips,
      currentApp: null,
      currentHour: 10,
      hourlyPatterns: [],
    });

    expect(result.find((p) => p.clipId === "a")).toBeUndefined();
  });

  it("respects maxResults", () => {
    const sequences: PasteSequence[] = Array.from({ length: 10 }, (_, i) => ({
      clipId: "a",
      nextClipId: `clip-${i}`,
      sourceApp: null,
      count: 10 - i,
      lastUsed: new Date().toISOString(),
    }));
    const recentClips = [
      makeClip("a"),
      ...Array.from({ length: 10 }, (_, i) => makeClip(`clip-${i}`)),
    ];

    const result = computePredictions({
      lastClipId: "a",
      sequences,
      recentClips,
      currentApp: null,
      currentHour: 10,
      hourlyPatterns: [],
      maxResults: 3,
    });

    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("combines multiple signals for stronger predictions", () => {
    const sequences: PasteSequence[] = [
      { clipId: "a", nextClipId: "b", sourceApp: "VS Code", count: 3, lastUsed: new Date().toISOString() },
    ];
    const recentClips = [
      makeClip("a", ["code"]),
      makeClip("b", ["code"]),
    ];

    const result = computePredictions({
      lastClipId: "a",
      sequences,
      recentClips,
      currentApp: "VS Code",
      currentHour: 10,
      hourlyPatterns: [{ clipId: "b", hour: 10, count: 3 }],
    });

    expect(result.length).toBe(1);
    expect(result[0].clipId).toBe("b");
    // Score should be higher with multiple signals
    expect(result[0].score).toBeGreaterThan(3);
  });

  it("filters out clips not in recentClips", () => {
    const sequences: PasteSequence[] = [
      { clipId: "a", nextClipId: "deleted-clip", sourceApp: null, count: 10, lastUsed: new Date().toISOString() },
    ];
    const recentClips = [makeClip("a"), makeClip("b")];

    const result = computePredictions({
      lastClipId: "a",
      sequences,
      recentClips,
      currentApp: null,
      currentHour: 10,
      hourlyPatterns: [],
    });

    expect(result.find((p) => p.clipId === "deleted-clip")).toBeUndefined();
  });
});

describe("confidenceColor", () => {
  it("returns green for high", () => {
    expect(confidenceColor("high")).toBe("#4ade80");
  });
  it("returns yellow for medium", () => {
    expect(confidenceColor("medium")).toBe("#facc15");
  });
  it("returns gray for low", () => {
    expect(confidenceColor("low")).toBe("#94a3b8");
  });
});

describe("confidenceLabel", () => {
  it("returns correct labels", () => {
    expect(confidenceLabel("high")).toBe("High");
    expect(confidenceLabel("medium")).toBe("Medium");
    expect(confidenceLabel("low")).toBe("Low");
  });
});

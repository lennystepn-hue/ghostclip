import { describe, it, expect } from "vitest";
import { detectChain, clipsInTimeWindow, CHAIN_TIME_WINDOW_MS } from "../clipboard-chains";
import type { ChainClip } from "../clipboard-chains";

const now = Date.now();

function makeClip(
  id: string,
  overrides: Partial<ChainClip> = {},
): ChainClip {
  return {
    id,
    content: `content-${id}`,
    type: "text",
    tags: [],
    sourceApp: null,
    createdAt: new Date(now - 1000).toISOString(), // 1 second ago
    ...overrides,
  };
}

describe("detectChain", () => {
  it("returns null when fewer than 2 clips", () => {
    expect(detectChain([])).toBeNull();
    expect(detectChain([makeClip("a")])).toBeNull();
  });

  it("returns null when clips are outside time window", () => {
    const oldClips = [
      makeClip("a", { createdAt: new Date(now - CHAIN_TIME_WINDOW_MS - 60000).toISOString() }),
      makeClip("b", { createdAt: new Date(now - CHAIN_TIME_WINDOW_MS - 30000).toISOString() }),
    ];
    expect(detectChain(oldClips)).toBeNull();
  });

  it("detects form-like template chains", () => {
    const clips: ChainClip[] = [
      makeClip("name", { content: "John Doe", createdAt: new Date(now - 4000).toISOString() }),
      makeClip("email", { content: "john@example.com", createdAt: new Date(now - 3000).toISOString() }),
      makeClip("phone", { content: "+1 555 123 4567", createdAt: new Date(now - 2000).toISOString() }),
    ];
    const result = detectChain(clips);
    expect(result).not.toBeNull();
    expect(result!.chainType).toBe("template");
    expect(result!.clipIds).toHaveLength(3);
    expect(result!.reason).toBe("form_fields");
  });

  it("detects URL research collections", () => {
    const clips: ChainClip[] = [
      makeClip("url1", { content: "https://example.com/article1", type: "url", createdAt: new Date(now - 3000).toISOString() }),
      makeClip("url2", { content: "https://example.com/article2", type: "url", createdAt: new Date(now - 2000).toISOString() }),
      makeClip("url3", { content: "https://example.com/article3", type: "url", createdAt: new Date(now - 1000).toISOString() }),
    ];
    const result = detectChain(clips);
    expect(result).not.toBeNull();
    expect(result!.chainType).toBe("collection");
    expect(result!.reason).toBe("url_cluster");
  });

  it("detects chains based on shared tags", () => {
    const clips: ChainClip[] = [
      makeClip("a", { tags: ["project-x", "code"], createdAt: new Date(now - 3000).toISOString() }),
      makeClip("b", { tags: ["project-x", "docs"], createdAt: new Date(now - 2000).toISOString() }),
      makeClip("c", { tags: ["project-x", "api"], createdAt: new Date(now - 1000).toISOString() }),
    ];
    const result = detectChain(clips);
    expect(result).not.toBeNull();
    expect(result!.chainType).toBe("chain");
    expect(result!.reason).toBe("shared_tags");
    expect(result!.suggestedName).toContain("Project-x");
  });

  it("detects chains from same source app with same type", () => {
    const clips: ChainClip[] = [
      makeClip("a", { sourceApp: "VS Code", tags: ["code"], createdAt: new Date(now - 3000).toISOString() }),
      makeClip("b", { sourceApp: "VS Code", tags: ["code"], createdAt: new Date(now - 2000).toISOString() }),
      makeClip("c", { sourceApp: "VS Code", tags: ["code"], createdAt: new Date(now - 1000).toISOString() }),
    ];
    const result = detectChain(clips);
    expect(result).not.toBeNull();
    expect(result!.clipIds).toHaveLength(3);
  });

  it("returns clips in chronological order (oldest first)", () => {
    const clips: ChainClip[] = [
      makeClip("url2", { content: "https://b.com", type: "url", createdAt: new Date(now - 1000).toISOString() }),
      makeClip("url1", { content: "https://a.com", type: "url", createdAt: new Date(now - 3000).toISOString() }),
      makeClip("url3", { content: "https://c.com", type: "url", createdAt: new Date(now - 500).toISOString() }),
    ];
    const result = detectChain(clips);
    expect(result).not.toBeNull();
    expect(result!.clipIds).toEqual(["url1", "url2", "url3"]);
  });

  it("assigns higher confidence to stronger chains", () => {
    // Strong chain: URLs + shared tags + same app + 4 clips
    const strongChain: ChainClip[] = [
      makeClip("a", { type: "url", content: "https://a.com", tags: ["research"], sourceApp: "Chrome", createdAt: new Date(now - 4000).toISOString() }),
      makeClip("b", { type: "url", content: "https://b.com", tags: ["research"], sourceApp: "Chrome", createdAt: new Date(now - 3000).toISOString() }),
      makeClip("c", { type: "url", content: "https://c.com", tags: ["research"], sourceApp: "Chrome", createdAt: new Date(now - 2000).toISOString() }),
      makeClip("d", { type: "url", content: "https://d.com", tags: ["research"], sourceApp: "Chrome", createdAt: new Date(now - 1000).toISOString() }),
    ];
    const result = detectChain(strongChain);
    expect(result).not.toBeNull();
    expect(result!.confidence).toBe("high");
  });

  it("returns null for unrelated clips with no signals", () => {
    // Two clips with different types, no tags, no source app, and long non-pattern content
    const clips: ChainClip[] = [
      makeClip("a", { content: "lorem ipsum dolor sit amet, consectetur adipiscing elit. sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", createdAt: new Date(now - 2000).toISOString() }),
      makeClip("b", { type: "image", content: "[Bild] screenshot of dashboard", createdAt: new Date(now - 1000).toISOString() }),
    ];
    const result = detectChain(clips);
    expect(result).toBeNull();
  });

  it("suggests appropriate names based on chain type", () => {
    // Template with source app
    const templateClips: ChainClip[] = [
      makeClip("a", { content: "Jane Smith", sourceApp: "Chrome", createdAt: new Date(now - 2000).toISOString() }),
      makeClip("b", { content: "jane@test.com", sourceApp: "Chrome", createdAt: new Date(now - 1000).toISOString() }),
      makeClip("c", { content: "+49 170 1234567", sourceApp: "Chrome", createdAt: new Date(now - 500).toISOString() }),
    ];
    const result = detectChain(templateClips);
    expect(result).not.toBeNull();
    expect(result!.suggestedName).toBeTruthy();
    expect(result!.suggestedName.length).toBeGreaterThan(0);
  });
});

describe("clipsInTimeWindow", () => {
  it("returns empty array for empty input", () => {
    expect(clipsInTimeWindow([])).toEqual([]);
  });

  it("filters clips outside the window", () => {
    const clips: ChainClip[] = [
      makeClip("recent", { createdAt: new Date(now - 1000).toISOString() }),
      makeClip("old", { createdAt: new Date(now - CHAIN_TIME_WINDOW_MS - 60000).toISOString() }),
    ];
    const result = clipsInTimeWindow(clips);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("recent");
  });

  it("keeps all clips within window", () => {
    const clips: ChainClip[] = [
      makeClip("a", { createdAt: new Date(now - 1000).toISOString() }),
      makeClip("b", { createdAt: new Date(now - 2000).toISOString() }),
      makeClip("c", { createdAt: new Date(now - 3000).toISOString() }),
    ];
    const result = clipsInTimeWindow(clips);
    expect(result).toHaveLength(3);
  });

  it("supports custom window size", () => {
    const clips: ChainClip[] = [
      makeClip("a", { createdAt: new Date(now - 500).toISOString() }),
      makeClip("b", { createdAt: new Date(now - 3000).toISOString() }),
    ];
    const result = clipsInTimeWindow(clips, 2000);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });
});

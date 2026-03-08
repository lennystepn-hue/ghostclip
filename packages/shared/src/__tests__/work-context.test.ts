import { describe, it, expect } from "vitest";
import {
  detectContexts,
  splitIntoSessions,
  getDominantTags,
  getDominantApps,
  generateContextName,
  fitsCurrentContext,
  tagSimilarity,
  getActiveContext,
  CONTEXT_SESSION_GAP_MS,
  CONTEXT_MIN_CLIPS,
} from "../work-context";
import type { ContextClip, WorkContext } from "../work-context";

const now = Date.now();

function makeClip(id: string, overrides: Partial<ContextClip> = {}): ContextClip {
  return {
    id,
    tags: [],
    sourceApp: null,
    mood: null,
    summary: null,
    createdAt: new Date(now - 1000).toISOString(),
    ...overrides,
  };
}

describe("getDominantTags", () => {
  it("returns empty for no clips", () => {
    expect(getDominantTags([])).toEqual([]);
  });

  it("returns empty when no tag appears in 2+ clips", () => {
    const clips = [
      makeClip("a", { tags: ["alpha"] }),
      makeClip("b", { tags: ["beta"] }),
    ];
    expect(getDominantTags(clips)).toEqual([]);
  });

  it("returns tags that appear in at least 2 clips", () => {
    const clips = [
      makeClip("a", { tags: ["code", "react"] }),
      makeClip("b", { tags: ["code", "api"] }),
      makeClip("c", { tags: ["react", "api"] }),
    ];
    const result = getDominantTags(clips);
    expect(result).toContain("code");
    expect(result).toContain("react");
    expect(result).toContain("api");
  });

  it("sorts by frequency descending", () => {
    const clips = [
      makeClip("a", { tags: ["code", "react"] }),
      makeClip("b", { tags: ["code", "api"] }),
      makeClip("c", { tags: ["code"] }),
    ];
    const result = getDominantTags(clips);
    expect(result[0]).toBe("code");
  });
});

describe("getDominantApps", () => {
  it("returns empty for no clips", () => {
    expect(getDominantApps([])).toEqual([]);
  });

  it("returns apps sorted by frequency", () => {
    const clips = [
      makeClip("a", { sourceApp: "VS Code" }),
      makeClip("b", { sourceApp: "VS Code" }),
      makeClip("c", { sourceApp: "Chrome" }),
    ];
    const result = getDominantApps(clips);
    expect(result[0]).toBe("VS Code");
    expect(result[1]).toBe("Chrome");
  });

  it("ignores null source apps", () => {
    const clips = [
      makeClip("a", { sourceApp: null }),
      makeClip("b", { sourceApp: "Chrome" }),
    ];
    const result = getDominantApps(clips);
    expect(result).toEqual(["Chrome"]);
  });
});

describe("generateContextName", () => {
  it("generates name from tags", () => {
    expect(generateContextName(["react", "api"], [])).toBe("React & Api");
  });

  it("generates name from app when no tags", () => {
    expect(generateContextName([], ["VS Code"])).toBe("VS Code Session");
  });

  it("returns default when no tags or apps", () => {
    expect(generateContextName([], [])).toBe("Work Session");
  });

  it("limits to 2 tags in name", () => {
    const name = generateContextName(["code", "react", "api", "testing"], []);
    expect(name).toBe("Code & React");
  });
});

describe("tagSimilarity", () => {
  it("returns 0 for empty arrays", () => {
    expect(tagSimilarity([], [])).toBe(0);
  });

  it("returns 1 for identical tags", () => {
    expect(tagSimilarity(["a", "b"], ["a", "b"])).toBe(1);
  });

  it("returns 0 for disjoint tags", () => {
    expect(tagSimilarity(["a", "b"], ["c", "d"])).toBe(0);
  });

  it("returns correct value for partial overlap", () => {
    // Jaccard: intersection=1, union=3
    expect(tagSimilarity(["a", "b"], ["b", "c"])).toBeCloseTo(1 / 3);
  });
});

describe("splitIntoSessions", () => {
  it("returns empty for no clips", () => {
    expect(splitIntoSessions([])).toEqual([]);
  });

  it("groups clips within time window", () => {
    const clips = [
      makeClip("a", { createdAt: new Date(now - 3000).toISOString() }),
      makeClip("b", { createdAt: new Date(now - 2000).toISOString() }),
      makeClip("c", { createdAt: new Date(now - 1000).toISOString() }),
    ];
    const sessions = splitIntoSessions(clips);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toHaveLength(3);
  });

  it("splits on time gaps exceeding session gap", () => {
    const clips = [
      makeClip("a", { createdAt: new Date(now - CONTEXT_SESSION_GAP_MS - 60000).toISOString() }),
      makeClip("b", { createdAt: new Date(now - 2000).toISOString() }),
      makeClip("c", { createdAt: new Date(now - 1000).toISOString() }),
    ];
    const sessions = splitIntoSessions(clips);
    expect(sessions).toHaveLength(2);
    expect(sessions[0]).toHaveLength(1);
    expect(sessions[1]).toHaveLength(2);
  });

  it("sorts clips by time within sessions", () => {
    const clips = [
      makeClip("c", { createdAt: new Date(now - 1000).toISOString() }),
      makeClip("a", { createdAt: new Date(now - 3000).toISOString() }),
      makeClip("b", { createdAt: new Date(now - 2000).toISOString() }),
    ];
    const sessions = splitIntoSessions(clips);
    expect(sessions[0].map(c => c.id)).toEqual(["a", "b", "c"]);
  });
});

describe("fitsCurrentContext", () => {
  const baseContext: WorkContext = {
    id: "ctx-1",
    name: "React Dev",
    tags: ["react", "code", "frontend"],
    sourceApps: ["VS Code"],
    clipIds: ["a", "b"],
    startedAt: new Date(now - 60000).toISOString(),
    lastActiveAt: new Date(now - 5000).toISOString(),
    active: true,
  };

  it("returns false when time gap exceeds session gap", () => {
    const clip = makeClip("new", {
      tags: ["react"],
      createdAt: new Date(now + CONTEXT_SESSION_GAP_MS + 1000).toISOString(),
    });
    expect(fitsCurrentContext(clip, baseContext, baseContext.lastActiveAt)).toBe(false);
  });

  it("returns true when clip shares tags with context", () => {
    const clip = makeClip("new", {
      tags: ["react", "component"],
      createdAt: new Date(now).toISOString(),
    });
    expect(fitsCurrentContext(clip, baseContext, baseContext.lastActiveAt)).toBe(true);
  });

  it("returns true when clip is from same source app", () => {
    const clip = makeClip("new", {
      sourceApp: "VS Code",
      createdAt: new Date(now).toISOString(),
    });
    expect(fitsCurrentContext(clip, baseContext, baseContext.lastActiveAt)).toBe(true);
  });

  it("returns true for unenriched clip within 5 minutes", () => {
    const clip = makeClip("new", {
      tags: [],
      createdAt: new Date(now).toISOString(),
    });
    expect(fitsCurrentContext(clip, baseContext, baseContext.lastActiveAt)).toBe(true);
  });

  it("returns false for unrelated clip", () => {
    const clip = makeClip("new", {
      tags: ["cooking", "recipe"],
      sourceApp: "Safari",
      createdAt: new Date(now + 6 * 60 * 1000).toISOString(), // 6 min after last
    });
    expect(fitsCurrentContext(clip, baseContext, baseContext.lastActiveAt)).toBe(false);
  });
});

describe("detectContexts", () => {
  it("returns empty for too few clips", () => {
    const clips = [makeClip("a"), makeClip("b")];
    expect(detectContexts(clips)).toEqual([]);
  });

  it("detects a single context from related clips", () => {
    const clips = [
      makeClip("a", { tags: ["code", "react"], sourceApp: "VS Code", createdAt: new Date(now - 3000).toISOString() }),
      makeClip("b", { tags: ["code", "api"], sourceApp: "VS Code", createdAt: new Date(now - 2000).toISOString() }),
      makeClip("c", { tags: ["code", "testing"], sourceApp: "VS Code", createdAt: new Date(now - 1000).toISOString() }),
    ];
    const contexts = detectContexts(clips);
    expect(contexts).toHaveLength(1);
    expect(contexts[0].clipIds).toHaveLength(3);
    expect(contexts[0].tags).toContain("code");
    expect(contexts[0].active).toBe(true);
  });

  it("detects multiple contexts from sessions with time gaps", () => {
    const clips = [
      // Session 1
      makeClip("a", { tags: ["code"], createdAt: new Date(now - CONTEXT_SESSION_GAP_MS - 120000).toISOString() }),
      makeClip("b", { tags: ["code"], createdAt: new Date(now - CONTEXT_SESSION_GAP_MS - 110000).toISOString() }),
      makeClip("c", { tags: ["code"], createdAt: new Date(now - CONTEXT_SESSION_GAP_MS - 100000).toISOString() }),
      // Session 2
      makeClip("d", { tags: ["email"], createdAt: new Date(now - 3000).toISOString() }),
      makeClip("e", { tags: ["email"], createdAt: new Date(now - 2000).toISOString() }),
      makeClip("f", { tags: ["email"], createdAt: new Date(now - 1000).toISOString() }),
    ];
    const contexts = detectContexts(clips);
    expect(contexts).toHaveLength(2);
    // Only the last context should be active
    expect(contexts[0].active).toBe(false);
    expect(contexts[1].active).toBe(true);
  });

  it("uses source app for naming when no dominant tags", () => {
    const clips = [
      makeClip("a", { sourceApp: "Chrome", createdAt: new Date(now - 3000).toISOString() }),
      makeClip("b", { sourceApp: "Chrome", createdAt: new Date(now - 2000).toISOString() }),
      makeClip("c", { sourceApp: "Chrome", createdAt: new Date(now - 1000).toISOString() }),
    ];
    const contexts = detectContexts(clips);
    expect(contexts).toHaveLength(1);
    expect(contexts[0].name).toBe("Chrome Session");
  });

  it("skips sessions with fewer than CONTEXT_MIN_CLIPS", () => {
    const clips = [
      // Session 1: only 2 clips (below threshold)
      makeClip("a", { createdAt: new Date(now - CONTEXT_SESSION_GAP_MS - 60000).toISOString() }),
      makeClip("b", { createdAt: new Date(now - CONTEXT_SESSION_GAP_MS - 50000).toISOString() }),
      // Session 2: 3 clips (meets threshold)
      makeClip("c", { tags: ["code"], createdAt: new Date(now - 3000).toISOString() }),
      makeClip("d", { tags: ["code"], createdAt: new Date(now - 2000).toISOString() }),
      makeClip("e", { tags: ["code"], createdAt: new Date(now - 1000).toISOString() }),
    ];
    const contexts = detectContexts(clips);
    expect(contexts).toHaveLength(1);
    expect(contexts[0].clipIds).toHaveLength(3);
  });
});

describe("getActiveContext", () => {
  it("returns null for empty contexts", () => {
    expect(getActiveContext([])).toBeNull();
  });

  it("returns the active context", () => {
    const contexts: WorkContext[] = [
      { id: "1", name: "A", tags: [], sourceApps: [], clipIds: [], startedAt: "", lastActiveAt: "", active: false },
      { id: "2", name: "B", tags: [], sourceApps: [], clipIds: [], startedAt: "", lastActiveAt: "", active: true },
    ];
    expect(getActiveContext(contexts)?.id).toBe("2");
  });

  it("returns null when no context is active", () => {
    const contexts: WorkContext[] = [
      { id: "1", name: "A", tags: [], sourceApps: [], clipIds: [], startedAt: "", lastActiveAt: "", active: false },
    ];
    expect(getActiveContext(contexts)).toBeNull();
  });
});

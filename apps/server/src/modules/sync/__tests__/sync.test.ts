import { describe, it, expect } from "vitest";
import { resolveConflict, mergeTags, mergeCollectionClips } from "../conflict";
import type { SyncMessage } from "@ghostclip/shared";

describe("Conflict Resolution", () => {
  it("delete always wins over update", () => {
    const del: SyncMessage = { type: "clip:delete", deviceId: "a", timestamp: new Date("2024-01-01"), payload: {} };
    const update: SyncMessage = { type: "clip:update", deviceId: "b", timestamp: new Date("2024-01-02"), payload: {} };
    expect(resolveConflict(del, update)).toBe("local");
    expect(resolveConflict(update, del)).toBe("remote");
  });

  it("last-write-wins for concurrent updates", () => {
    const older: SyncMessage = { type: "clip:update", deviceId: "a", timestamp: new Date("2024-01-01"), payload: {} };
    const newer: SyncMessage = { type: "clip:update", deviceId: "b", timestamp: new Date("2024-01-02"), payload: {} };
    expect(resolveConflict(older, newer)).toBe("remote");
    expect(resolveConflict(newer, older)).toBe("local");
  });

  it("tie-breaker uses device ID", () => {
    const a: SyncMessage = { type: "clip:update", deviceId: "aaa", timestamp: new Date("2024-01-01"), payload: {} };
    const b: SyncMessage = { type: "clip:update", deviceId: "bbb", timestamp: new Date("2024-01-01"), payload: {} };
    expect(resolveConflict(a, b)).toBe("local"); // "aaa" < "bbb"
  });
});

describe("Merge Functions", () => {
  it("merges tags as union", () => {
    expect(mergeTags(["a", "b"], ["b", "c"])).toEqual(expect.arrayContaining(["a", "b", "c"]));
    expect(mergeTags(["a", "b"], ["b", "c"])).toHaveLength(3);
  });

  it("merges collection clip IDs as union", () => {
    expect(mergeCollectionClips(["1", "2"], ["2", "3"])).toEqual(expect.arrayContaining(["1", "2", "3"]));
  });
});

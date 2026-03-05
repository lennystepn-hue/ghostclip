import type { SyncMessage } from "@ghostclip/shared";

/**
 * GhostClip Conflict Resolution:
 * - Clips are immutable (created/deleted/pinned, not content-edited)
 * - Pin/Archive: Last-Write-Wins based on timestamp
 * - Delete: Delete always wins
 * - Tags/Collections: Merge (union of both sets)
 */

export function resolveConflict(local: SyncMessage, remote: SyncMessage): "local" | "remote" | "merge" {
  // Delete always wins
  if (local.type === "clip:delete") return "local";
  if (remote.type === "clip:delete") return "remote";

  // For updates: last-write-wins
  if (local.type === "clip:update" && remote.type === "clip:update") {
    const localTime = new Date(local.timestamp).getTime();
    const remoteTime = new Date(remote.timestamp).getTime();

    if (localTime === remoteTime) {
      // Tie-breaker: alphabetical device ID
      return local.deviceId < remote.deviceId ? "local" : "remote";
    }

    return localTime > remoteTime ? "local" : "remote";
  }

  // Default: last-write-wins
  const localTime = new Date(local.timestamp).getTime();
  const remoteTime = new Date(remote.timestamp).getTime();
  return localTime >= remoteTime ? "local" : "remote";
}

export function mergeTags(localTags: string[], remoteTags: string[]): string[] {
  return [...new Set([...localTags, ...remoteTags])];
}

export function mergeCollectionClips(localIds: string[], remoteIds: string[]): string[] {
  return [...new Set([...localIds, ...remoteIds])];
}

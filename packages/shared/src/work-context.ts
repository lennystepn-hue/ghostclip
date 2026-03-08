// Work Context Detection — detect what project/task the user is working on

export interface ContextClip {
  id: string;
  tags: string[];
  sourceApp: string | null;
  mood: string | null;
  summary: string | null;
  createdAt: string;
}

export interface WorkContext {
  id: string;
  name: string;
  tags: string[];
  sourceApps: string[];
  clipIds: string[];
  startedAt: string;
  lastActiveAt: string;
  active: boolean;
}

// Time window for grouping clips into a session (30 minutes)
export const CONTEXT_SESSION_GAP_MS = 30 * 60 * 1000;

// Minimum clips to form a context
export const CONTEXT_MIN_CLIPS = 3;

// Maximum number of top tags to use as context name
const MAX_NAME_TAGS = 2;

/**
 * Extract dominant tags from a set of clips.
 * Returns tags that appear in at least 2 clips, sorted by frequency.
 */
export function getDominantTags(clips: ContextClip[]): string[] {
  const tagCounts = new Map<string, number>();
  for (const clip of clips) {
    for (const tag of clip.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }
  return [...tagCounts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}

/**
 * Extract dominant source apps from a set of clips.
 * Returns apps sorted by frequency.
 */
export function getDominantApps(clips: ContextClip[]): string[] {
  const appCounts = new Map<string, number>();
  for (const clip of clips) {
    if (clip.sourceApp) {
      appCounts.set(clip.sourceApp, (appCounts.get(clip.sourceApp) || 0) + 1);
    }
  }
  return [...appCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([app]) => app);
}

/**
 * Generate a human-readable context name from dominant tags and apps.
 */
export function generateContextName(tags: string[], apps: string[]): string {
  if (tags.length > 0) {
    const nameTags = tags.slice(0, MAX_NAME_TAGS).map(capitalize);
    return nameTags.join(" & ");
  }
  if (apps.length > 0) {
    return `${apps[0]} Session`;
  }
  return "Work Session";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Split clips into sessions based on time gaps.
 * A new session starts when there's a gap > CONTEXT_SESSION_GAP_MS between clips.
 */
export function splitIntoSessions(clips: ContextClip[]): ContextClip[][] {
  if (clips.length === 0) return [];

  const sorted = [...clips].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const sessions: ContextClip[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const prevTime = new Date(sorted[i - 1].createdAt).getTime();
    const currTime = new Date(sorted[i].createdAt).getTime();
    if (currTime - prevTime > CONTEXT_SESSION_GAP_MS) {
      sessions.push([sorted[i]]);
    } else {
      sessions[sessions.length - 1].push(sorted[i]);
    }
  }

  return sessions;
}

/**
 * Compute similarity score between two sets of tags.
 * Returns 0-1 (Jaccard similarity).
 */
export function tagSimilarity(tagsA: string[], tagsB: string[]): number {
  if (tagsA.length === 0 && tagsB.length === 0) return 0;
  const setA = new Set(tagsA);
  const setB = new Set(tagsB);
  let intersection = 0;
  for (const tag of setA) {
    if (setB.has(tag)) intersection++;
  }
  const union = new Set([...tagsA, ...tagsB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Detect if a new clip belongs to the current context or represents a context switch.
 * Returns true if the clip is a good fit for the given context.
 */
export function fitsCurrentContext(
  clip: ContextClip,
  context: WorkContext,
  lastClipTime: string,
): boolean {
  // Time gap check: if too long since last clip, likely a new session
  const timeSinceLastClip = new Date(clip.createdAt).getTime() - new Date(lastClipTime).getTime();
  if (timeSinceLastClip > CONTEXT_SESSION_GAP_MS) return false;

  // Check tag overlap with the current context
  const similarity = tagSimilarity(clip.tags, context.tags);
  if (similarity >= 0.2) return true;

  // Check if same source app
  if (clip.sourceApp && context.sourceApps.includes(clip.sourceApp)) return true;

  // If clip has no tags yet (not enriched), give it benefit of the doubt based on time proximity
  if (clip.tags.length === 0 && timeSinceLastClip < 5 * 60 * 1000) return true;

  return false;
}

/**
 * Detect work contexts from a list of clips.
 * Groups clips into contexts based on time proximity, shared tags, and source apps.
 */
export function detectContexts(clips: ContextClip[]): WorkContext[] {
  if (clips.length < CONTEXT_MIN_CLIPS) return [];

  const sessions = splitIntoSessions(clips);
  const contexts: WorkContext[] = [];

  for (const session of sessions) {
    if (session.length < CONTEXT_MIN_CLIPS) continue;

    const dominantTags = getDominantTags(session);
    const dominantApps = getDominantApps(session);
    const name = generateContextName(dominantTags, dominantApps);

    const sorted = [...session].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    contexts.push({
      id: `ctx-${sorted[0].id}`,
      name,
      tags: dominantTags,
      sourceApps: dominantApps,
      clipIds: sorted.map(c => c.id),
      startedAt: sorted[0].createdAt,
      lastActiveAt: sorted[sorted.length - 1].createdAt,
      active: false,
    });
  }

  // Mark the most recent context as active
  if (contexts.length > 0) {
    contexts[contexts.length - 1].active = true;
  }

  return contexts;
}

/**
 * Get the current active context from a list of contexts.
 */
export function getActiveContext(contexts: WorkContext[]): WorkContext | null {
  return contexts.find(c => c.active) || null;
}

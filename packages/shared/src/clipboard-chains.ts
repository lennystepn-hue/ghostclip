// Smart Clipboard Chains — detect copy sequences and offer to save as collections

export interface ChainClip {
  id: string;
  content: string;
  type: string;
  tags: string[];
  sourceApp: string | null;
  createdAt: string;
}

export type ChainType = "template" | "collection" | "chain";

export interface DetectedChain {
  clipIds: string[];
  chainType: ChainType;
  suggestedName: string;
  confidence: "high" | "medium" | "low";
  reason: string;
}

// Time window for chain detection (5 minutes)
export const CHAIN_TIME_WINDOW_MS = 5 * 60 * 1000;

// Minimum clips to form a chain
export const CHAIN_MIN_CLIPS = 2;

// Content patterns for template detection (form-filling)
const FORM_PATTERNS = [
  /^[A-Z][\w\s.-]{1,40}$/,   // simple name (starts with capital, max 40 chars)
  /^[\w.+-]+@[\w.-]+\.\w+$/,  // email
  /^\+?[\d\s()-]{7,}$/,       // phone
  /^\d{4,5}\s+\w/,            // postal code + city
];

// Detect if clips look like form fields (short, varied content types)
function looksLikeFormData(clips: ChainClip[]): boolean {
  if (clips.length < 2) return false;
  const textClips = clips.filter(c => c.type === "text");
  if (textClips.length < 2) return false;

  let matchCount = 0;
  for (const clip of textClips) {
    const trimmed = clip.content.trim();
    if (trimmed.length > 500) continue; // form fields are short
    if (FORM_PATTERNS.some(p => p.test(trimmed))) {
      matchCount++;
    }
  }
  return matchCount >= 2;
}

// Detect if clips are all URLs (research collection)
function looksLikeResearch(clips: ChainClip[]): boolean {
  const urlClips = clips.filter(c => c.type === "url");
  return urlClips.length >= 2;
}

// Detect if clips share significant tags
function getSharedTags(clips: ChainClip[]): string[] {
  const clipsWithTags = clips.filter(c => c.tags.length > 0);
  if (clipsWithTags.length < 2) return [];

  const tagCounts = new Map<string, number>();
  for (const clip of clipsWithTags) {
    for (const tag of clip.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }

  // Tags that appear in at least 2 clips
  return [...tagCounts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}

// Check if clips are from the same source app
function sameSourceApp(clips: ChainClip[]): string | null {
  const apps = clips.map(c => c.sourceApp).filter(Boolean) as string[];
  if (apps.length < 2) return null;
  const first = apps[0];
  if (apps.every(a => a === first)) return first;
  return null;
}

// Detect if clips share a common content type
function sameContentType(clips: ChainClip[]): string | null {
  const types = clips.map(c => c.type);
  const first = types[0];
  if (types.every(t => t === first)) return first;
  return null;
}

// Suggest a name for the detected chain
function suggestChainName(
  chainType: ChainType,
  clips: ChainClip[],
  sharedTags: string[],
  sourceApp: string | null,
): string {
  const tagPart = sharedTags.length > 0 ? sharedTags[0] : null;

  switch (chainType) {
    case "template": {
      if (tagPart) return `${capitalize(tagPart)} Template`;
      if (sourceApp) return `${sourceApp} Template`;
      return "Clipboard Template";
    }
    case "collection": {
      if (tagPart) return `${capitalize(tagPart)} Collection`;
      const urlCount = clips.filter(c => c.type === "url").length;
      if (urlCount >= 2) return "Research Links";
      return "Clipboard Collection";
    }
    case "chain": {
      if (tagPart) return `${capitalize(tagPart)} Chain`;
      if (sourceApp) return `${sourceApp} Sequence`;
      return "Copy Sequence";
    }
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Detect clipboard chains from recent clips within a time window.
 * Returns a detected chain if clips appear related, or null if no chain found.
 */
export function detectChain(recentClips: ChainClip[]): DetectedChain | null {
  if (recentClips.length < CHAIN_MIN_CLIPS) return null;

  // Filter to clips within the time window relative to the newest clip
  const newest = Math.max(...recentClips.map(c => new Date(c.createdAt).getTime()));
  const windowClips = recentClips.filter(c => {
    const age = newest - new Date(c.createdAt).getTime();
    return age <= CHAIN_TIME_WINDOW_MS;
  });

  if (windowClips.length < CHAIN_MIN_CLIPS) return null;

  // Sort by creation time (oldest first for natural chain order)
  const sorted = [...windowClips].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const sharedTags = getSharedTags(sorted);
  const commonApp = sameSourceApp(sorted);
  const commonType = sameContentType(sorted);

  // Scoring: how related are these clips?
  let score = 0;
  let reasons: string[] = [];

  // Form data detection (template)
  if (looksLikeFormData(sorted)) {
    score += 4;
    reasons.push("form_fields");
  }

  // URL cluster (research)
  if (looksLikeResearch(sorted)) {
    score += 4;
    reasons.push("url_cluster");
  }

  // Shared tags (semantic relationship)
  if (sharedTags.length > 0) {
    score += Math.min(sharedTags.length * 2, 6);
    reasons.push("shared_tags");
  }

  // Same source app
  if (commonApp) {
    score += 2;
    reasons.push("same_app");
  }

  // Same content type
  if (commonType) {
    score += 1;
    reasons.push("same_type");
  }

  // Bonus for more clips in the chain
  if (sorted.length >= 4) {
    score += 2;
    reasons.push("long_chain");
  } else if (sorted.length >= 3) {
    score += 1;
    reasons.push("multi_clip");
  }

  // Minimum threshold
  if (score < 3) return null;

  // Determine chain type
  let chainType: ChainType;
  if (reasons.includes("form_fields")) {
    chainType = "template";
  } else if (reasons.includes("url_cluster")) {
    chainType = "collection";
  } else {
    chainType = "chain";
  }

  const confidence = score >= 7 ? "high" : score >= 4 ? "medium" : "low";

  return {
    clipIds: sorted.map(c => c.id),
    chainType,
    suggestedName: suggestChainName(chainType, sorted, sharedTags, commonApp),
    confidence,
    reason: reasons[0],
  };
}

/**
 * Filter clips to only those within the chain time window from the newest clip.
 * Utility for callers that need to pre-filter before calling detectChain.
 */
export function clipsInTimeWindow(clips: ChainClip[], windowMs: number = CHAIN_TIME_WINDOW_MS): ChainClip[] {
  if (clips.length === 0) return [];
  const newest = Math.max(...clips.map(c => new Date(c.createdAt).getTime()));
  return clips.filter(c => newest - new Date(c.createdAt).getTime() <= windowMs);
}

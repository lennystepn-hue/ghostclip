// Predictive Paste engine — learns copy-paste sequences and predicts next clip

export interface PasteSequence {
  clipId: string;
  nextClipId: string;
  sourceApp: string | null;
  count: number;
  lastUsed: string;
}

export interface Prediction {
  clipId: string;
  score: number;
  confidence: "high" | "medium" | "low";
  reason: string;
}

export interface PredictionClip {
  id: string;
  content: string;
  summary: string | null;
  tags: string[];
  sourceApp: string | null;
  type: string;
  createdAt: string;
}

// Compute predictions from paste sequences and context
export function computePredictions(opts: {
  lastClipId: string | null;
  sequences: PasteSequence[];
  recentClips: PredictionClip[];
  currentApp: string | null;
  currentHour: number;
  hourlyPatterns: { clipId: string; hour: number; count: number }[];
  maxResults?: number;
}): Prediction[] {
  const {
    lastClipId,
    sequences,
    recentClips,
    currentApp,
    currentHour,
    hourlyPatterns,
    maxResults = 5,
  } = opts;

  const scores = new Map<string, { score: number; reasons: string[] }>();

  function addScore(clipId: string, points: number, reason: string) {
    const existing = scores.get(clipId) || { score: 0, reasons: [] };
    existing.score += points;
    existing.reasons.push(reason);
    scores.set(clipId, existing);
  }

  // 1. Sequence prediction: if we know what typically follows the last clip
  if (lastClipId) {
    const follows = sequences.filter((s) => s.clipId === lastClipId);
    const totalFollows = follows.reduce((sum, s) => sum + s.count, 0);
    for (const seq of follows) {
      const frequency = seq.count / Math.max(totalFollows, 1);
      addScore(seq.nextClipId, frequency * 10, "sequence");
    }
  }

  // 2. App context: clips frequently pasted in the current app
  if (currentApp) {
    const appSequences = sequences.filter(
      (s) => s.sourceApp && s.sourceApp.toLowerCase().includes(currentApp.toLowerCase()),
    );
    const appCounts = new Map<string, number>();
    for (const seq of appSequences) {
      appCounts.set(seq.nextClipId, (appCounts.get(seq.nextClipId) || 0) + seq.count);
    }
    for (const [clipId, count] of appCounts) {
      addScore(clipId, Math.min(count * 0.5, 4), "app_context");
    }
  }

  // 3. Time patterns: clips typically used around this hour
  const hourWindow = 2;
  const relevantHourly = hourlyPatterns.filter(
    (p) => Math.abs(p.hour - currentHour) <= hourWindow ||
           Math.abs(p.hour - currentHour + 24) <= hourWindow ||
           Math.abs(p.hour - currentHour - 24) <= hourWindow,
  );
  for (const hp of relevantHourly) {
    addScore(hp.clipId, Math.min(hp.count * 0.3, 3), "time_pattern");
  }

  // 4. Tag-based similarity with last clip (semantic prediction)
  if (lastClipId) {
    const lastClip = recentClips.find((c) => c.id === lastClipId);
    if (lastClip?.tags?.length) {
      for (const clip of recentClips) {
        if (clip.id === lastClipId) continue;
        const sharedTags = clip.tags?.filter((t) => lastClip.tags.includes(t)) || [];
        if (sharedTags.length > 0) {
          addScore(clip.id, sharedTags.length * 0.8, "similar_tags");
        }
      }
    }
  }

  // Filter out the last clip itself and clips without scores
  const recentClipIds = new Set(recentClips.map((c) => c.id));
  const results: Prediction[] = [];
  for (const [clipId, { score, reasons }] of scores) {
    if (clipId === lastClipId) continue;
    if (!recentClipIds.has(clipId)) continue;
    if (score < 0.5) continue;
    results.push({
      clipId,
      score,
      confidence: score >= 6 ? "high" : score >= 3 ? "medium" : "low",
      reason: reasons[0], // primary reason
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxResults);
}

// Determine confidence color for UI display
export function confidenceColor(confidence: "high" | "medium" | "low"): string {
  switch (confidence) {
    case "high": return "#4ade80";
    case "medium": return "#facc15";
    case "low": return "#94a3b8";
  }
}

// Confidence label for display
export function confidenceLabel(confidence: "high" | "medium" | "low"): string {
  switch (confidence) {
    case "high": return "High";
    case "medium": return "Medium";
    case "low": return "Low";
  }
}

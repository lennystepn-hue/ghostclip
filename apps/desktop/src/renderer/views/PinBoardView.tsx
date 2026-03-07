import React, { useState, useMemo, useRef } from "react";
import { useClips } from "../hooks/useClips";

// Mood → background color mapping for sticky notes
const moodColors: Record<string, string> = {
  happy: "#2a2400",
  positive: "#1e2a00",
  excited: "#2a1a00",
  calm: "#001a2a",
  focused: "#1a002a",
  neutral: "#1e1e2a",
  sad: "#00122a",
  frustrated: "#2a0808",
  angry: "#2a0000",
  productive: "#002a1a",
  work: "#002a1a",
};

const moodBorderColors: Record<string, string> = {
  happy: "rgba(250,204,21,0.25)",
  positive: "rgba(132,204,22,0.25)",
  excited: "rgba(249,115,22,0.25)",
  calm: "rgba(56,189,248,0.25)",
  focused: "rgba(168,85,247,0.25)",
  neutral: "rgba(148,163,184,0.15)",
  sad: "rgba(96,165,250,0.25)",
  frustrated: "rgba(248,113,113,0.25)",
  angry: "rgba(239,68,68,0.3)",
  productive: "rgba(52,211,153,0.25)",
  work: "rgba(52,211,153,0.25)",
};

const moodAccentColors: Record<string, string> = {
  happy: "#fde047",
  positive: "#84cc16",
  excited: "#f97316",
  calm: "#38bdf8",
  focused: "#a855f7",
  neutral: "#94a3b8",
  sad: "#60a5fa",
  frustrated: "#f87171",
  angry: "#ef4444",
  productive: "#34d399",
  work: "#34d399",
};

// Slight rotations for sticky note feel
const rotations = [-1.5, 0.8, -0.5, 1.2, -0.9, 0.4, -1.1, 0.7, -0.3, 1.5];

function getCardSize(clip: any): "small" | "medium" | "large" {
  if (clip.type === "image" && clip.imageData) return "large";
  const len = clip.content?.length || 0;
  if (len > 200 || (clip.summary && clip.summary.length > 80)) return "medium";
  return "small";
}

function getCardDimensions(size: "small" | "medium" | "large") {
  switch (size) {
    case "small": return { minWidth: 160, maxWidth: 200, minHeight: 120 };
    case "medium": return { minWidth: 220, maxWidth: 280, minHeight: 160 };
    case "large": return { minWidth: 260, maxWidth: 320, minHeight: 220 };
  }
}

function getMoodColor(mood: string | null): string {
  if (!mood) return "rgba(30,30,42,0.9)";
  const key = mood.toLowerCase();
  return moodColors[key] || "rgba(30,30,42,0.9)";
}

function getMoodBorder(mood: string | null): string {
  if (!mood) return "rgba(255,255,255,0.08)";
  const key = mood.toLowerCase();
  return moodBorderColors[key] || "rgba(255,255,255,0.08)";
}

function getMoodAccent(mood: string | null): string {
  if (!mood) return "#748ffc";
  const key = mood.toLowerCase();
  return moodAccentColors[key] || "#748ffc";
}

// Group pinned clips by their first tag (or "Ungrouped" if none)
function groupByTag(clips: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  for (const clip of clips) {
    const group = clip.tags?.[0] || "Ungrouped";
    if (!groups[group]) groups[group] = [];
    groups[group].push(clip);
  }
  return groups;
}

export function PinBoardView() {
  const { clips, loading, copyClip, pinClip } = useClips();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cardOrder, setCardOrder] = useState<string[]>([]);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragSourceId = useRef<string | null>(null);

  const pinnedClips = useMemo(() => {
    const pinned = clips.filter((c) => c.pinned && !c.archived);
    // Apply custom card order if set
    if (cardOrder.length > 0) {
      const orderMap = new Map(cardOrder.map((id, i) => [id, i]));
      return [...pinned].sort((a, b) => {
        const ia = orderMap.has(a.id) ? orderMap.get(a.id)! : Infinity;
        const ib = orderMap.has(b.id) ? orderMap.get(b.id)! : Infinity;
        return ia - ib;
      });
    }
    return pinned;
  }, [clips, cardOrder]);

  const groups = useMemo(() => groupByTag(pinnedClips), [pinnedClips]);

  async function handleCopy(clipId: string) {
    await copyClip(clipId);
    setCopiedId(clipId);
    setTimeout(() => setCopiedId(null), 1500);
  }

  // HTML5 Drag and Drop handlers
  function handleDragStart(e: React.DragEvent, id: string) {
    dragSourceId.current = id;
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(id);
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    const sourceId = dragSourceId.current;
    if (!sourceId || sourceId === targetId) {
      setDragOverId(null);
      return;
    }
    // Build new order from current pinned list
    const ids = pinnedClips.map((c) => c.id);
    const srcIdx = ids.indexOf(sourceId);
    const tgtIdx = ids.indexOf(targetId);
    if (srcIdx === -1 || tgtIdx === -1) return;
    const newOrder = [...ids];
    newOrder.splice(srcIdx, 1);
    newOrder.splice(tgtIdx, 0, sourceId);
    setCardOrder(newOrder);
    setDragOverId(null);
    dragSourceId.current = null;
  }

  function handleDragEnd() {
    setDragOverId(null);
    dragSourceId.current = null;
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
        <div style={{
          width: "24px", height: "24px", borderRadius: "50%",
          border: "2px solid rgba(92,124,250,0.2)", borderTopColor: "#5c7cfa",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (pinnedClips.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>📌</div>
        <p style={{ fontSize: "15px", color: "#6a6a80", fontWeight: 600, marginBottom: "6px" }}>
          No pinned clips yet
        </p>
        <p style={{ fontSize: "12px", color: "#4a4a60" }}>
          Pin clips from the Clips view to display them here on your board
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{
          fontSize: "18px", fontWeight: 700, color: "#e0e0e8", margin: 0,
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "28px", height: "28px", borderRadius: "8px",
            background: "rgba(92,124,250,0.15)",
            fontSize: "14px",
          }}>📌</span>
          Pin Board
        </h2>
        <p style={{ fontSize: "12px", color: "#5c5c75", marginTop: "4px" }}>
          {pinnedClips.length} pinned clip{pinnedClips.length !== 1 ? "s" : ""} — drag to rearrange
        </p>
      </div>

      {/* Board sections */}
      {Object.entries(groups).map(([groupName, groupClips]) => (
        <BoardSection
          key={groupName}
          title={groupName}
          clips={groupClips}
          copiedId={copiedId}
          dragOverId={dragOverId}
          onCopy={handleCopy}
          onUnpin={(id) => pinClip(id)}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />
      ))}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

// === Board Section ===

function BoardSection({ title, clips, copiedId, dragOverId, onCopy, onUnpin, onDragStart, onDragOver, onDrop, onDragEnd }: {
  title: string;
  clips: any[];
  copiedId: string | null;
  dragOverId: string | null;
  onCopy: (id: string) => void;
  onUnpin: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}) {
  return (
    <div style={{ marginBottom: "32px" }}>
      {/* Section header */}
      <div style={{
        display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px",
      }}>
        <span style={{
          fontSize: "11px", fontWeight: 700, color: "#748ffc", textTransform: "uppercase",
          letterSpacing: "0.8px",
        }}>
          {title}
        </span>
        <span style={{
          fontSize: "10px", color: "#3a3a52", background: "rgba(255,255,255,0.04)",
          padding: "1px 8px", borderRadius: "12px",
        }}>
          {clips.length}
        </span>
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.04)" }} />
      </div>

      {/* Cards grid */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-start",
      }}>
        {clips.map((clip, index) => (
          <PinCard
            key={clip.id}
            clip={clip}
            index={index}
            isCopied={copiedId === clip.id}
            isDragOver={dragOverId === clip.id}
            onCopy={() => onCopy(clip.id)}
            onUnpin={() => onUnpin(clip.id)}
            onDragStart={(e) => onDragStart(e, clip.id)}
            onDragOver={(e) => onDragOver(e, clip.id)}
            onDrop={(e) => onDrop(e, clip.id)}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
}

// === Pin Card ===

function PinCard({ clip, index, isCopied, isDragOver, onCopy, onUnpin, onDragStart, onDragOver, onDrop, onDragEnd }: {
  clip: any;
  index: number;
  isCopied: boolean;
  isDragOver: boolean;
  onCopy: () => void;
  onUnpin: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [transformResult, setTransformResult] = useState<string | null>(null);
  const [transformLoading, setTransformLoading] = useState(false);

  const size = getCardSize(clip);
  const dims = getCardDimensions(size);
  const rotation = rotations[index % rotations.length];
  const bgColor = getMoodColor(clip.mood);
  const borderColor = getMoodBorder(clip.mood);
  const accentColor = getMoodAccent(clip.mood);

  async function handleSummarize() {
    if (!clip.content || clip.type !== "text") return;
    setTransformLoading(true);
    try {
      const api = (window as any).ghostclip;
      const result = await api?.aiTransform?.(clip.content, "shorter");
      setTransformResult(result || null);
    } finally {
      setTransformLoading(false);
    }
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setTransformResult(null); }}
      style={{
        minWidth: `${dims.minWidth}px`,
        maxWidth: `${dims.maxWidth}px`,
        minHeight: `${dims.minHeight}px`,
        padding: "14px",
        borderRadius: "4px",
        background: bgColor,
        border: `1px solid ${borderColor}`,
        boxShadow: hovered
          ? `0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.04)`
          : `0 4px 16px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.2)`,
        transform: isDragOver
          ? `rotate(${rotation}deg) scale(1.04)`
          : hovered
            ? `rotate(${rotation * 0.3}deg) scale(1.03) translateY(-3px)`
            : `rotate(${rotation}deg)`,
        transition: "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
        cursor: "grab",
        position: "relative",
        opacity: isDragOver ? 0.7 : 1,
        animation: `cardIn 0.3s ease-out ${(index % 5) * 0.05}s both`,
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {/* Pin accent line at top */}
      <div style={{
        position: "absolute", top: 0, left: "14px", right: "14px",
        height: "2px", borderRadius: "0 0 2px 2px",
        background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)`,
      }} />

      {/* Pin icon indicator */}
      <div style={{
        position: "absolute", top: "8px", right: "10px",
        fontSize: "11px", opacity: 0.4, lineHeight: 1,
      }}>
        📌
      </div>

      {/* Type badge */}
      <div style={{ marginBottom: "8px", marginRight: "20px" }}>
        <span style={{
          fontSize: "9px", fontWeight: 700, color: accentColor,
          background: `${accentColor}18`,
          padding: "2px 6px", borderRadius: "4px",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.3px",
        }}>
          {clip.type?.toUpperCase() || "TEXT"}
        </span>
      </div>

      {/* Image preview (large cards) */}
      {size === "large" && clip.type === "image" && clip.imageData && (
        <div style={{ marginBottom: "10px", borderRadius: "3px", overflow: "hidden" }}>
          <img
            src={`data:image/png;base64,${clip.imageData}`}
            alt={clip.summary || "Image"}
            style={{
              width: "100%", maxHeight: "140px",
              objectFit: "cover", borderRadius: "3px",
              border: `1px solid ${borderColor}`,
              display: "block",
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}

      {/* Summary / title */}
      {clip.summary && (
        <p style={{
          fontSize: "12px", fontWeight: 600, color: "#e0e0e8",
          margin: "0 0 6px 0", lineHeight: 1.4,
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        } as any}>
          {clip.summary}
        </p>
      )}

      {/* Content preview */}
      {clip.content && clip.type === "text" && (
        <p style={{
          fontSize: "11px", color: "#9090a8", margin: "0 0 8px 0",
          lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: size === "small" ? 2 : size === "medium" ? 4 : 3,
          WebkitBoxOrient: "vertical",
        } as any}>
          {clip.content}
        </p>
      )}

      {/* URL preview */}
      {clip.type === "url" && clip.content && (
        <p style={{
          fontSize: "11px", color: "#5c7cfa", margin: "0 0 8px 0",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          opacity: 0.8,
        }}>
          {clip.content.match(/https?:\/\/\S+/)?.[0]?.slice(0, 50) || clip.content.slice(0, 50)}
        </p>
      )}

      {/* AI transform result */}
      {transformResult && (
        <div style={{
          padding: "8px 10px", borderRadius: "4px", marginBottom: "8px",
          background: "rgba(0,0,0,0.25)", border: `1px solid ${accentColor}30`,
          fontSize: "10px", color: "#c4c4d4", lineHeight: 1.5,
        }}>
          {transformResult}
        </div>
      )}

      {/* Mood badge */}
      {clip.mood && (
        <div style={{ marginBottom: "6px" }}>
          <span style={{
            fontSize: "9px", color: accentColor, fontStyle: "italic",
            opacity: 0.7,
          }}>
            {clip.mood}
          </span>
        </div>
      )}

      {/* Tags */}
      {clip.tags && clip.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", marginBottom: "8px" }}>
          {clip.tags.slice(0, 3).map((tag: string) => (
            <span key={tag} style={{
              fontSize: "9px", color: accentColor,
              background: `${accentColor}15`,
              padding: "1px 6px", borderRadius: "12px",
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Hover action bar */}
      {hovered && (
        <div
          style={{
            display: "flex", gap: "4px", marginTop: "auto", paddingTop: "8px",
            borderTop: `1px solid ${borderColor}`,
            animation: "fadeIn 0.15s ease",
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Copy */}
          <CardActionButton
            title={isCopied ? "Copied!" : "Copy"}
            accent={accentColor}
            active={isCopied}
            onClick={(e) => { e.stopPropagation(); onCopy(); }}
          >
            {isCopied
              ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            }
          </CardActionButton>

          {/* Summarize (text only) */}
          {clip.type === "text" && clip.content && (
            <CardActionButton
              title="Shorten with AI"
              accent={accentColor}
              active={transformLoading}
              onClick={(e) => { e.stopPropagation(); handleSummarize(); }}
            >
              {transformLoading
                ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
              }
            </CardActionButton>
          )}

          {/* Open URL */}
          {clip.type === "url" && clip.content && (
            <CardActionButton
              title="Open URL"
              accent={accentColor}
              onClick={(e) => {
                e.stopPropagation();
                const url = clip.content.match(/https?:\/\/\S+/)?.[0];
                if (url) (window as any).ghostclip?.openUrl?.(url);
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </CardActionButton>
          )}

          {/* Unpin */}
          <CardActionButton
            title="Unpin"
            accent="#ef4444"
            onClick={(e) => { e.stopPropagation(); onUnpin(); }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </CardActionButton>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(10px) scale(0.96); }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// === Card Action Button ===

function CardActionButton({ children, title, accent, active, onClick }: {
  children: React.ReactNode;
  title: string;
  accent: string;
  active?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "4px 6px", borderRadius: "4px",
        border: `1px solid ${hov || active ? `${accent}40` : "rgba(255,255,255,0.07)"}`,
        background: hov || active ? `${accent}18` : "rgba(0,0,0,0.2)",
        color: hov || active ? accent : "#6a6a80",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

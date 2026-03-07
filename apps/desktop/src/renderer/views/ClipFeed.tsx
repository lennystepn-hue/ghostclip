import React, { useState, useMemo, useEffect, useRef } from "react";
import { useClips } from "../hooks/useClips";
import {
  detectContentKind,
  getAutoActions,
  CONTENT_KIND_LABELS,
} from "@ghostclip/shared";

type FilterType = "all" | "pinned" | "today" | "week" | "archive";

const filterChips: { id: FilterType; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "today", label: "Heute" },
  { id: "week", label: "Woche" },
  { id: "pinned", label: "Gepinnt" },
  { id: "archive", label: "Archiv" },
];

const typeEmoji: Record<string, string> = {
  text: "T",
  image: "IMG",
  url: "URL",
  file: "FILE",
};

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "gerade eben";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `vor ${mins} Min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `vor ${days} Tag${days > 1 ? "en" : ""}`;
  return new Date(date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

export function ClipFeed() {
  const { clips, loading, copyClip, pinClip, archiveClip, deleteClip } = useClips();
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [semanticMode, setSemanticMode] = useState(false);
  const [semanticResults, setSemanticResults] = useState<any[] | null>(null);
  const [replyToast, setReplyToast] = useState<{ clipId: string; replies: any[] } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [prevClipCount, setPrevClipCount] = useState(0);

  // Listen for auto-reply suggestions
  useEffect(() => {
    const api = (window as any).ghostclip;
    if (!api?.onReplySuggestions) return;
    const cleanup = api.onReplySuggestions((data: any) => {
      setReplyToast(data);
      setTimeout(() => setReplyToast(null), 15000);
    });
    return cleanup;
  }, []);

  useEffect(() => {
    if (!semanticMode || !search.trim()) {
      setSemanticResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      const api = (window as any).ghostclip;
      const results = await api?.semanticSearch?.(search);
      setSemanticResults(results || []);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, semanticMode]);

  // Track new clips for animation
  useEffect(() => {
    setPrevClipCount(clips.length);
  }, [clips.length]);

  const filteredClips = useMemo(() => {
    let result = clips;

    if (filter === "pinned") result = result.filter((c) => c.pinned);
    if (filter === "archive") result = result.filter((c) => c.archived);
    if (filter === "today") {
      const today = new Date().toDateString();
      result = result.filter((c) => new Date(c.createdAt).toDateString() === today);
    }
    if (filter === "week") {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      result = result.filter((c) => new Date(c.createdAt).getTime() > weekAgo);
    }
    if (filter !== "archive") result = result.filter((c) => !c.archived);

    if (search && !semanticMode) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.summary?.toLowerCase().includes(q) ||
          c.tags?.some((t: string) => t.toLowerCase().includes(q)) ||
          c.content?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [clips, filter, search, semanticMode]);

  async function handleCopy(clipId: string) {
    await copyClip(clipId);
    setCopiedId(clipId);
    setTimeout(() => setCopiedId(null), 1500);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
        <div style={{
          width: "24px", height: "24px", borderRadius: "50%",
          border: "2px solid rgba(92,124,250,0.2)",
          borderTopColor: "#5c7cfa",
          animation: "spin 0.8s linear infinite",
        }} />
      </div>
    );
  }

  const displayClips = semanticResults !== null ? semanticResults : filteredClips;

  return (
    <div>
      {/* Filter Chips */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
        {filterChips.map(chip => (
          <button
            key={chip.id}
            onClick={() => setFilter(chip.id)}
            style={{
              padding: "5px 14px",
              borderRadius: "20px",
              border: filter === chip.id ? "1px solid rgba(92,124,250,0.35)" : "1px solid rgba(255,255,255,0.06)",
              background: filter === chip.id ? "rgba(66,99,235,0.15)" : "rgba(255,255,255,0.02)",
              color: filter === chip.id ? "#91a7ff" : "#6a6a80",
              fontSize: "12px",
              fontWeight: filter === chip.id ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5c5c75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={semanticMode ? "Semantisch suchen..." : "Clips durchsuchen..."}
            style={{
              width: "100%",
              padding: "10px 14px 10px 36px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(34,34,46,0.6)",
              color: "#c4c4d4",
              fontSize: "13px",
              outline: "none",
              transition: "border-color 0.2s",
              boxSizing: "border-box",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(92,124,250,0.3)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
          />
        </div>
        <button
          onClick={() => setSemanticMode(!semanticMode)}
          title={semanticMode ? "Semantische Suche aktiv" : "Semantische Suche aktivieren"}
          style={{
            padding: "8px 12px",
            borderRadius: "10px",
            border: semanticMode ? "1px solid rgba(92,124,250,0.4)" : "1px solid rgba(255,255,255,0.06)",
            background: semanticMode ? "rgba(66,99,235,0.2)" : "rgba(34,34,46,0.6)",
            color: semanticMode ? "#91a7ff" : "#5c5c75",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          AI
        </button>
      </div>

      {/* Auto-Reply Toast */}
      {replyToast && replyToast.replies?.length > 0 && (
        <div style={{
          marginBottom: "16px", padding: "14px 18px", borderRadius: "14px",
          background: "linear-gradient(135deg, rgba(66,99,235,0.1), rgba(168,85,247,0.06))",
          border: "1px solid rgba(92,124,250,0.2)",
          animation: "slideDown 0.3s ease-out",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#91a7ff" }}>
              Antwortvorschlaege
            </span>
            <button onClick={() => setReplyToast(null)} style={{
              background: "rgba(255,255,255,0.05)", border: "none", color: "#5c5c75",
              cursor: "pointer", fontSize: "11px", width: "22px", height: "22px",
              borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {replyToast.replies.slice(0, 3).map((r: any) => (
              <button key={r.id} onClick={() => {
                (window as any).ghostclip?.writeClipboard?.(r.text);
                setReplyToast(null);
              }} style={{
                textAlign: "left", padding: "10px 14px", borderRadius: "10px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                color: "#c4c4d4", fontSize: "12px", cursor: "pointer", lineHeight: 1.5,
                transition: "all 0.15s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              >
                <span style={{ fontSize: "9px", color: "#748ffc", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {r.tone}
                </span>
                <br />{r.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clips */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {displayClips.map((clip, index) => {
          const isExpanded = expandedId === clip.id;
          const isNew = index === 0 && clips.length > prevClipCount;
          const isCopied = copiedId === clip.id;

          return (
            <ClipItem
              key={clip.id}
              clip={clip}
              isExpanded={isExpanded}
              isNew={isNew}
              isCopied={isCopied}
              onToggle={() => setExpandedId(isExpanded ? null : clip.id)}
              onCopy={() => handleCopy(clip.id)}
              onPin={() => pinClip(clip.id)}
              onArchive={() => archiveClip(clip.id)}
              onDelete={() => deleteClip(clip.id)}
            />
          );
        })}

        {displayClips.length === 0 && (
          <EmptyState search={search} filter={filter} />
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-12px); max-height: 0; }
          to { opacity: 1; transform: translateY(0); max-height: 300px; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes expandIn {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 500px; }
        }
      `}</style>
    </div>
  );
}

// === Clip Item ===

function ClipItem({ clip, isExpanded, isNew, isCopied, onToggle, onCopy, onPin, onArchive, onDelete }: {
  clip: any;
  isExpanded: boolean;
  isNew: boolean;
  isCopied: boolean;
  onToggle: () => void;
  onCopy: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const maxTags = 3;
  const visibleTags = clip.tags?.slice(0, maxTags) || [];
  const extraTags = (clip.tags?.length || 0) - maxTags;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onToggle}
      style={{
        padding: "12px 16px",
        borderRadius: "12px",
        background: isExpanded
          ? "rgba(255,255,255,0.06)"
          : hovered
            ? "rgba(255,255,255,0.04)"
            : "rgba(255,255,255,0.02)",
        border: `1px solid ${clip.pinned ? "rgba(92,124,250,0.2)" : isExpanded ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)"}`,
        cursor: "pointer",
        transition: "all 0.2s ease",
        animation: isNew ? "slideIn 0.4s ease-out" : undefined,
      }}
    >
      {/* Main row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Type badge + Summary */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              fontSize: "9px", fontWeight: 700, color: "#748ffc",
              background: "rgba(76,110,245,0.12)", padding: "2px 6px",
              borderRadius: "4px", fontFamily: "'JetBrains Mono', monospace",
              flexShrink: 0,
            }}>
              {typeEmoji[clip.type] || "?"}
            </span>
            {clip.pinned && (
              <span style={{ fontSize: "11px", color: "#748ffc", flexShrink: 0 }}>📌</span>
            )}
            <span style={{
              fontSize: "13px", color: "#e0e0e8", fontWeight: 500,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {clip.summary || clip.content?.slice(0, 80) || "..."}
            </span>
          </div>

          {/* Content preview (collapsed) */}
          {!isExpanded && clip.content && clip.type === "text" && !clip.summary?.includes(clip.content?.slice(0, 30)) && (
            <p style={{
              fontSize: "12px", color: "#6a6a80", marginTop: "4px", lineHeight: 1.5,
              overflow: "hidden", textOverflow: "ellipsis",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            } as any}>
              {clip.content.slice(0, 200)}
            </p>
          )}

          {/* URL preview */}
          {clip.type === "url" && clip.content && !isExpanded && (() => {
            const urlMatch = clip.content.match(/https?:\/\/\S+/);
            const url = urlMatch ? urlMatch[0] : clip.content;
            return (
              <div style={{
                fontSize: "11px", color: "#5c7cfa", marginTop: "4px",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                opacity: 0.7,
              }}>
                {url.length > 70 ? url.slice(0, 70) + "..." : url}
              </div>
            );
          })()}

          {/* Image thumbnail (collapsed) */}
          {clip.type === "image" && clip.imageData && !isExpanded && (
            <div style={{ marginTop: "6px" }}>
              <img
                src={`data:image/png;base64,${clip.imageData}`}
                alt={clip.summary || "Bild"}
                style={{
                  maxWidth: "160px", maxHeight: "80px", borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.08)", objectFit: "cover",
                }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}

          {/* Tags (collapsed: max 3 + counter) */}
          {!isExpanded && visibleTags.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
              {visibleTags.map((tag: string) => (
                <span key={tag} style={{
                  fontSize: "10px", color: "#91a7ff",
                  background: "rgba(66,99,235,0.1)",
                  padding: "1px 8px", borderRadius: "20px",
                }}>
                  {tag}
                </span>
              ))}
              {extraTags > 0 && (
                <span style={{
                  fontSize: "10px", color: "#5c5c75",
                  background: "rgba(255,255,255,0.04)",
                  padding: "1px 7px", borderRadius: "20px",
                }}>
                  +{extraTags}
                </span>
              )}
              {clip.mood && (
                <span style={{ fontSize: "10px", color: "#4a4a60", fontStyle: "italic", marginLeft: "2px" }}>
                  {clip.mood}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right side: time + hover actions */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
          <span style={{ fontSize: "10px", color: "#4a4a60", fontFamily: "'JetBrains Mono', monospace" }}>
            {relativeTime(clip.createdAt)}
          </span>

          {/* Action buttons — only on hover or expanded */}
          {(hovered || isExpanded) && (
            <div style={{ display: "flex", gap: "3px", animation: "fadeIn 0.15s ease" }}
              onClick={(e) => e.stopPropagation()}
            >
              {clip.type === "url" && (
                <ActionButton
                  icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>}
                  title="Oeffnen"
                  color="#22c55e"
                  onClick={() => { const u = clip.content.match(/https?:\/\/\S+/)?.[0]; if (u) (window as any).ghostclip?.openUrl?.(u); }}
                />
              )}
              <ActionButton
                icon={isCopied
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                }
                title={isCopied ? "Kopiert!" : "Kopieren"}
                color={isCopied ? "#22c55e" : undefined}
                active={isCopied}
                onClick={onCopy}
              />
              <ActionButton
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill={clip.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 1 1 0 0 0 1-1V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1a1 1 0 0 0 1 1 1 1 0 0 1 1 1z"/></svg>}
                title={clip.pinned ? "Entpinnen" : "Pinnen"}
                color={clip.pinned ? "#748ffc" : undefined}
                active={clip.pinned}
                onClick={onPin}
              />
              <ActionButton
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.65 5H8.35a2 2 0 0 0-1.85 1.3L5 10 3 8"/><path d="M7 14h.01"/><path d="M17 14h.01"/><rect width="18" height="8" x="3" y="10" rx="2"/></svg>}
                title="Archivieren"
                onClick={onArchive}
              />
              <ActionButton
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>}
                title="Loeschen"
                color="#ef4444"
                onClick={onDelete}
              />
            </div>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{ marginTop: "12px", animation: "expandIn 0.25s ease-out", overflow: "hidden" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Full content */}
          {clip.content && (
            <div style={{
              padding: "12px 14px", borderRadius: "10px",
              background: "rgba(0,0,0,0.15)",
              border: "1px solid rgba(255,255,255,0.04)",
              marginBottom: "10px",
            }}>
              {clip.type === "image" && clip.imageData && (
                <img
                  src={`data:image/png;base64,${clip.imageData}`}
                  alt={clip.summary || "Bild"}
                  style={{
                    maxWidth: "100%", maxHeight: "300px", borderRadius: "8px",
                    marginBottom: "8px", objectFit: "contain",
                  }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
              <pre style={{
                fontSize: "12px", color: "#b0b0c8", lineHeight: 1.6,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
                margin: 0, fontFamily: clip.type === "text" ? "inherit" : "'JetBrains Mono', monospace",
                maxHeight: "200px", overflowY: "auto",
              }}>
                {clip.content}
              </pre>
            </div>
          )}

          {/* URL — clickable */}
          {clip.type === "url" && clip.content && (() => {
            const urlMatch = clip.content.match(/https?:\/\/\S+/);
            const url = urlMatch ? urlMatch[0] : clip.content;
            return (
              <button
                onClick={() => (window as any).ghostclip?.openUrl?.(url)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 12px", borderRadius: "8px", marginBottom: "10px",
                  background: "rgba(92,124,250,0.08)", border: "1px solid rgba(92,124,250,0.15)",
                  color: "#5c7cfa", fontSize: "11px", cursor: "pointer",
                  width: "100%", textAlign: "left",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span>
              </button>
            );
          })()}

          {/* All tags */}
          {clip.tags && clip.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
              {clip.tags.map((tag: string) => (
                <span key={tag} style={{
                  fontSize: "10px", color: "#91a7ff",
                  background: "rgba(66,99,235,0.1)",
                  padding: "2px 10px", borderRadius: "20px",
                  cursor: "default",
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* AI Auto-Actions Panel */}
          {clip.content && clip.type !== "image" && (
            <AutoActionPanel content={clip.content} />
          )}

          {/* AI Transform Buttons */}
          {clip.type === "text" && clip.content && (
            <TransformBar content={clip.content} />
          )}

          {/* Similar Clips */}
          <SimilarClips clipId={clip.id} />

          {/* Meta row */}
          <div style={{ display: "flex", gap: "16px", fontSize: "10px", color: "#4a4a60", flexWrap: "wrap" }}>
            {clip.sourceApp && <span>App: <span style={{ color: "#6a6a80" }}>{clip.sourceApp}</span></span>}
            {clip.mood && <span>Mood: <span style={{ color: "#6a6a80" }}>{clip.mood}</span></span>}
            {clip.sensitivity && clip.sensitivity !== "low" && (
              <span style={{ color: clip.sensitivity === "critical" ? "#ef4444" : "#f97316" }}>
                Sensibilitaet: {clip.sensitivity}
              </span>
            )}
            <span>{new Date(clip.createdAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
          </div>

          {/* Sensitivity warning */}
          {clip.sensitivity && ["critical", "high"].includes(clip.sensitivity) && (
            <div style={{
              fontSize: "10px",
              color: clip.sensitivity === "critical" ? "#ef4444" : "#f97316",
              marginTop: "8px", padding: "6px 10px", borderRadius: "8px",
              background: clip.sensitivity === "critical" ? "rgba(239,68,68,0.08)" : "rgba(249,115,22,0.08)",
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              <span style={{
                display: "inline-block", width: "6px", height: "6px", borderRadius: "50%",
                background: clip.sensitivity === "critical" ? "#ef4444" : "#f97316",
                animation: "pulse 1.5s infinite",
              }} />
              {clip.sensitivity === "critical" ? "KRITISCH" : "Sensibel"} — wird automatisch geloescht
              <AutoExpireTimer createdAt={clip.createdAt} />
            </div>
          )}
        </div>
      )}

      {/* Enrichment indicator */}
      {!clip.enriched && clip.tags?.length === 0 && (
        <div style={{ fontSize: "10px", color: "#3a3a52", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{
            width: "10px", height: "10px", borderRadius: "50%",
            border: "1.5px solid rgba(92,124,250,0.3)", borderTopColor: "#5c7cfa",
            animation: "spin 1s linear infinite",
          }} />
          AI analysiert...
        </div>
      )}
    </div>
  );
}

// === Action Button ===

function ActionButton({ icon, title, color, active, onClick }: {
  icon: React.ReactNode; title: string; color?: string; active?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? `${color}15` : "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        color: color || "#8888a0",
        cursor: "pointer",
        padding: "5px",
        borderRadius: "7px",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = color ? `${color}20` : "rgba(255,255,255,0.08)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = active ? `${color}15` : "rgba(255,255,255,0.04)"; }}
    >
      {icon}
    </button>
  );
}

// === Empty State ===

function EmptyState({ search, filter }: { search: string; filter: string }) {
  const messages: Record<string, { icon: string; title: string; sub: string }> = {
    search: { icon: "🔍", title: "Keine Ergebnisse", sub: "Versuch einen anderen Suchbegriff" },
    pinned: { icon: "📌", title: "Keine gepinnten Clips", sub: "Pinne wichtige Clips um sie hier zu sehen" },
    archive: { icon: "📦", title: "Archiv ist leer", sub: "Archivierte Clips erscheinen hier" },
    today: { icon: "📋", title: "Noch nichts kopiert heute", sub: "Kopiere etwas — es erscheint hier sofort" },
    week: { icon: "📅", title: "Keine Clips diese Woche", sub: "Clips der letzten 7 Tage erscheinen hier" },
    default: { icon: "👻", title: "Noch keine Clips", sub: "Kopiere etwas — GhostClip merkt sich alles" },
  };

  const key = search ? "search" : filter !== "all" ? filter : "default";
  const msg = messages[key] || messages.default;

  return (
    <div style={{
      textAlign: "center", padding: "60px 20px",
      animation: "fadeIn 0.3s ease",
    }}>
      <div style={{ fontSize: "40px", marginBottom: "12px", opacity: 0.6 }}>{msg.icon}</div>
      <p style={{ fontSize: "14px", color: "#6a6a80", fontWeight: 600, marginBottom: "4px" }}>{msg.title}</p>
      <p style={{ fontSize: "12px", color: "#4a4a60" }}>{msg.sub}</p>
    </div>
  );
}

// === Auto Expire Timer ===

function AutoExpireTimer({ createdAt }: { createdAt: string }) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    const update = () => {
      const created = new Date(createdAt).getTime();
      const expiresAt = created + 5 * 60 * 1000;
      const left = Math.max(0, expiresAt - Date.now());
      if (left <= 0) {
        setRemaining("abgelaufen");
      } else {
        const mins = Math.floor(left / 60000);
        const secs = Math.floor((left % 60000) / 1000);
        setRemaining(`${mins}:${secs.toString().padStart(2, "0")}`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", fontWeight: 600,
      color: remaining === "abgelaufen" ? "#ef4444" : "#f97316",
    }}>
      ({remaining})
    </span>
  );
}

// === AI Transform Bar ===

const transformModes = [
  { id: "shorter", label: "Kuerzer", icon: "✂" },
  { id: "formal", label: "Formell", icon: "👔" },
  { id: "casual", label: "Locker", icon: "😎" },
  { id: "translate_en", label: "EN", icon: "🇬🇧" },
  { id: "translate_de", label: "DE", icon: "🇩🇪" },
  { id: "fix_grammar", label: "Korrektur", icon: "✓" },
  { id: "summarize", label: "Zusammenfassen", icon: "📝" },
  { id: "explain", label: "Erklaeren", icon: "💡" },
];

function TransformBar({ content }: { content: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const transform = async (mode: string) => {
    setLoading(mode);
    setResult(null);
    try {
      const api = (window as any).ghostclip;
      const text = await api?.aiTransform?.(content, mode);
      setResult(text || "Keine Antwort");
    } catch (err: any) {
      setResult("Fehler: " + (err.message || "Unbekannt"));
    } finally {
      setLoading(null);
    }
  };

  const copyResult = () => {
    if (!result) return;
    (window as any).ghostclip?.writeClipboard?.(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: result ? "8px" : 0 }}>
        <span style={{ fontSize: "10px", color: "#5c5c75", lineHeight: "26px", marginRight: "4px" }}>AI:</span>
        {transformModes.map(m => (
          <button
            key={m.id}
            onClick={() => transform(m.id)}
            disabled={!!loading}
            style={{
              padding: "3px 10px", borderRadius: "14px", fontSize: "10px",
              border: "1px solid rgba(92,124,250,0.15)",
              background: loading === m.id ? "rgba(66,99,235,0.2)" : "rgba(66,99,235,0.06)",
              color: loading === m.id ? "#91a7ff" : "#748ffc",
              cursor: loading ? "wait" : "pointer",
              fontWeight: 500, transition: "all 0.15s",
              opacity: loading && loading !== m.id ? 0.4 : 1,
            }}
          >
            {loading === m.id ? "..." : `${m.icon} ${m.label}`}
          </button>
        ))}
      </div>
      {result && (
        <div style={{
          padding: "10px 14px", borderRadius: "10px",
          background: "rgba(66,99,235,0.06)", border: "1px solid rgba(92,124,250,0.15)",
          animation: "fadeIn 0.2s ease",
        }}>
          <pre style={{
            fontSize: "12px", color: "#c4c4d4", lineHeight: 1.6, margin: 0,
            whiteSpace: "pre-wrap", wordBreak: "break-word",
            maxHeight: "150px", overflowY: "auto",
          }}>{result}</pre>
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            <button onClick={copyResult} style={{
              padding: "4px 12px", borderRadius: "8px", fontSize: "10px", fontWeight: 600,
              background: copied ? "rgba(34,197,94,0.15)" : "rgba(66,99,235,0.15)",
              border: "none", color: copied ? "#22c55e" : "#748ffc", cursor: "pointer",
            }}>
              {copied ? "Kopiert!" : "Kopieren"}
            </button>
            <button onClick={() => setResult(null)} style={{
              padding: "4px 12px", borderRadius: "8px", fontSize: "10px",
              background: "rgba(255,255,255,0.04)", border: "none", color: "#5c5c75", cursor: "pointer",
            }}>
              Schliessen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// === AI Auto-Action Panel ===

function AutoActionPanel({ content }: { content: string }) {
  // All hooks must be called before any early return (Rules of Hooks)
  const detected = useMemo(() => detectContentKind(content), [content]);
  const [enabled, setEnabled] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Check if this content kind is enabled in settings
  useEffect(() => {
    const api = (window as any).ghostclip;
    api?.getSettings?.().then((s: any) => {
      if (!s) return;
      const globalEnabled = s.autoActionsEnabled !== "false";
      const kindEnabled = s[`autoAction_${detected.kind}`] !== "false";
      setEnabled(globalEnabled && kindEnabled);
    });
  }, [detected.kind]);

  // Early returns after all hooks
  if (detected.kind === "text" || detected.kind === "url") return null;
  if (!enabled) return null;

  const actions = getAutoActions(detected);

  async function runAction(actionType: string) {
    const api = (window as any).ghostclip;
    setActiveAction(actionType);
    setResult(null);

    try {
      switch (actionType) {
        case "format_json": {
          const parsed = JSON.parse(content);
          setResult(JSON.stringify(parsed, null, 2));
          break;
        }
        case "validate_json": {
          try {
            JSON.parse(content);
            setResult("Gültiges JSON");
          } catch (e: any) {
            setResult("Ungültiges JSON: " + e.message);
          }
          break;
        }
        case "format_xml": {
          // Simple XML indent via regex
          let depth = 0;
          const formatted = content
            .replace(/>\s*</g, ">\n<")
            .split("\n")
            .map((line) => {
              const isClose = /^<\//.test(line.trim());
              const isSelfClose = /\/>$/.test(line.trim());
              if (isClose && depth > 0) depth--;
              const indented = "  ".repeat(depth) + line.trim();
              if (!isClose && !isSelfClose && /<[^/]/.test(line) && !/<[^/][^>]*>.*<\//.test(line)) depth++;
              return indented;
            })
            .join("\n");
          setResult(formatted);
          break;
        }
        case "explain_cron": {
          const cron = detected.metadata.cron as string;
          const text = await api?.aiTransform?.(
            `Cron expression: ${cron}`,
            "explain",
          );
          setResult(text || "Cron-Ausdruck konnte nicht erklärt werden.");
          break;
        }
        case "explain_regex": {
          const pattern = detected.metadata.pattern as string;
          const text = await api?.aiTransform?.(
            `Regex pattern: ${pattern}`,
            "explain",
          );
          setResult(text || "Regex konnte nicht erklärt werden.");
          break;
        }
        case "test_regex": {
          setResult("Paste text below to test against " + detected.metadata.pattern);
          break;
        }
        case "search_error": {
          const query = content.split("\n")[0].slice(0, 120);
          api?.openUrl?.("https://stackoverflow.com/search?q=" + encodeURIComponent(query));
          setResult("Stack Overflow Suche geöffnet.");
          break;
        }
        case "ai_explain": {
          const text = await api?.aiTransform?.(content.slice(0, 2000), "explain");
          setResult(text || "Keine Erklärung verfügbar.");
          break;
        }
        case "ai_review": {
          const text = await api?.aiTransform?.(content.slice(0, 2000), "review");
          setResult(text || "Kein Review verfügbar.");
          break;
        }
        case "relative_time": {
          const dt = detected.metadata.datetime as string;
          const ms = Date.now() - new Date(dt).getTime();
          const abs = Math.abs(ms);
          const future = ms < 0;
          let label: string;
          if (abs < 60_000) label = "gerade eben";
          else if (abs < 3_600_000) label = future ? `in ${Math.round(abs / 60_000)} Minuten` : `vor ${Math.round(abs / 60_000)} Minuten`;
          else if (abs < 86_400_000) label = future ? `in ${Math.round(abs / 3_600_000)} Stunden` : `vor ${Math.round(abs / 3_600_000)} Stunden`;
          else label = future ? `in ${Math.round(abs / 86_400_000)} Tagen` : `vor ${Math.round(abs / 86_400_000)} Tagen`;
          setResult(label);
          break;
        }
        case "convert_timezone": {
          const dt = detected.metadata.datetime as string;
          const date = new Date(dt);
          if (isNaN(date.getTime())) {
            setResult("Datum konnte nicht geparst werden.");
          } else {
            const utc = date.toUTCString();
            const local = date.toLocaleString();
            setResult(`UTC: ${utc}\nLokal: ${local}`);
          }
          break;
        }
        case "open_maps": {
          const query = encodeURIComponent(content.slice(0, 200));
          api?.openUrl?.("https://maps.google.com/maps?q=" + query);
          setResult("In Google Maps geöffnet.");
          break;
        }
        case "copy_formatted":
        case "copy_hex": {
          const val = (detected.metadata.phone ?? detected.metadata.hex ?? content) as string;
          api?.writeClipboard?.(val);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
          setResult(null);
          break;
        }
        case "contacts_template": {
          const phone = detected.metadata.phone as string;
          const vcf = `BEGIN:VCARD\nVERSION:3.0\nTEL:${phone}\nEND:VCARD`;
          setResult(vcf);
          break;
        }
        default:
          break;
      }
    } catch (err: any) {
      setResult("Fehler: " + (err.message || "Unbekannt"));
    } finally {
      setActiveAction(null);
    }
  }

  const kindLabel = CONTENT_KIND_LABELS[detected.kind];

  return (
    <div style={{ marginBottom: "10px" }}>
      {/* Kind badge + action buttons */}
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center", marginBottom: result ? "8px" : 0 }}>
        <span style={{
          fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
          color: "#a78bfa", background: "rgba(139,92,246,0.1)", padding: "2px 7px", borderRadius: "4px",
          marginRight: "4px",
        }}>
          {kindLabel}
        </span>

        {/* Color preview for hex */}
        {detected.kind === "color_hex" && (
          <span style={{
            display: "inline-block", width: "20px", height: "20px", borderRadius: "4px",
            background: detected.metadata.hex as string,
            border: "1px solid rgba(255,255,255,0.15)", flexShrink: 0,
          }} title={detected.metadata.hex as string} />
        )}

        {actions.map((action) => (
          <button
            key={action.type}
            onClick={() => runAction(action.type)}
            disabled={activeAction !== null}
            style={{
              padding: "3px 10px", borderRadius: "14px", fontSize: "10px",
              border: "1px solid rgba(139,92,246,0.2)",
              background: activeAction === action.type ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.07)",
              color: activeAction === action.type ? "#c4b5fd" : "#a78bfa",
              cursor: activeAction ? "wait" : "pointer",
              fontWeight: 500, transition: "all 0.15s",
              opacity: activeAction && activeAction !== action.type ? 0.4 : 1,
            }}
          >
            {activeAction === action.type ? "..." : action.label}
          </button>
        ))}

        {copied && (
          <span style={{ fontSize: "10px", color: "#22c55e", marginLeft: "4px" }}>Kopiert!</span>
        )}
      </div>

      {/* Result display */}
      {result && (
        <div style={{
          padding: "10px 14px", borderRadius: "10px",
          background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)",
          animation: "fadeIn 0.2s ease",
        }}>
          <pre style={{
            fontSize: "12px", color: "#c4c4d4", lineHeight: 1.6, margin: 0,
            whiteSpace: "pre-wrap", wordBreak: "break-word",
            maxHeight: "150px", overflowY: "auto",
          }}>{result}</pre>
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            <button onClick={() => {
              (window as any).ghostclip?.writeClipboard?.(result);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }} style={{
              padding: "4px 12px", borderRadius: "8px", fontSize: "10px", fontWeight: 600,
              background: "rgba(139,92,246,0.15)", border: "none", color: "#a78bfa", cursor: "pointer",
            }}>
              Ergebnis kopieren
            </button>
            <button onClick={() => setResult(null)} style={{
              padding: "4px 12px", borderRadius: "8px", fontSize: "10px",
              background: "rgba(255,255,255,0.04)", border: "none", color: "#5c5c75", cursor: "pointer",
            }}>
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// === Similar Clips ===

function SimilarClips({ clipId }: { clipId: string }) {
  const [similar, setSimilar] = useState<any[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadSimilar = async () => {
    if (loaded) { setSimilar(null); setLoaded(false); return; }
    const api = (window as any).ghostclip;
    const results = await api?.getSimilarClips?.(clipId);
    setSimilar(results?.filter((c: any) => c.similarity > 0.7) || []);
    setLoaded(true);
  };

  return (
    <div style={{ marginBottom: "8px" }}>
      <button onClick={loadSimilar} style={{
        padding: "3px 10px", borderRadius: "14px", fontSize: "10px",
        border: "1px solid rgba(168,85,247,0.15)",
        background: loaded ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.05)",
        color: "#c084fc", cursor: "pointer", fontWeight: 500,
      }}>
        {loaded ? "Verbergen" : "Aehnliche Clips finden"}
      </button>
      {similar && similar.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px", animation: "fadeIn 0.2s ease" }}>
          {similar.map((c: any) => (
            <div key={c.id} style={{
              padding: "8px 12px", borderRadius: "8px",
              background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.1)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: "11px", color: "#c4c4d4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {c.summary || c.content?.slice(0, 60)}
              </span>
              <span style={{ fontSize: "9px", color: "#8b5cf6", fontFamily: "'JetBrains Mono', monospace", marginLeft: "8px" }}>
                {Math.round(c.similarity * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
      {similar && similar.length === 0 && loaded && (
        <span style={{ fontSize: "10px", color: "#4a4a60", marginLeft: "8px" }}>Keine aehnlichen Clips gefunden</span>
      )}
    </div>
  );
}

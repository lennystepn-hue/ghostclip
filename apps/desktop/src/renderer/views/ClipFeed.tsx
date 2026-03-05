import React, { useState, useMemo, useEffect } from "react";
import { useClips } from "../hooks/useClips";

interface ClipFeedProps {
  filter?: "all" | "pinned" | "today" | "week" | "archive";
}

const typeEmoji: Record<string, string> = {
  text: "T",
  image: "IMG",
  url: "URL",
  file: "FILE",
};

export function ClipFeed({ filter = "all" }: ClipFeedProps) {
  const { clips, loading, copyClip, pinClip, archiveClip, deleteClip } = useClips();
  const [search, setSearch] = useState("");
  const [semanticMode, setSemanticMode] = useState(false);
  const [semanticResults, setSemanticResults] = useState<any[] | null>(null);
  const [replyToast, setReplyToast] = useState<{ clipId: string; replies: any[] } | null>(null);

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

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.summary?.toLowerCase().includes(q) ||
          c.tags?.some((t) => t.toLowerCase().includes(q)) ||
          c.content?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [clips, filter, search]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
        <div style={{ color: "#5c5c75" }}>Laden...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", alignItems: "center" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={semanticMode ? "Semantisch suchen..." : "Clips durchsuchen..."}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(34,34,46,0.6)",
            color: "#c4c4d4",
            fontSize: "13px",
            outline: "none",
          }}
        />
        <button
          onClick={() => setSemanticMode(!semanticMode)}
          title={semanticMode ? "Semantische Suche aktiv" : "Semantische Suche aktivieren"}
          style={{
            padding: "6px 10px",
            borderRadius: "8px",
            border: semanticMode ? "1px solid rgba(92,124,250,0.4)" : "1px solid rgba(255,255,255,0.06)",
            background: semanticMode ? "rgba(66,99,235,0.2)" : "rgba(34,34,46,0.6)",
            color: semanticMode ? "#91a7ff" : "#5c5c75",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          AI
        </button>
      </div>

      {/* Auto-Reply Toast */}
      {replyToast && replyToast.replies?.length > 0 && (
        <div style={{
          marginBottom: "12px", padding: "12px 16px", borderRadius: "12px",
          background: "linear-gradient(135deg, rgba(66,99,235,0.12), rgba(168,85,247,0.08))",
          border: "1px solid rgba(92,124,250,0.2)",
          animation: "fadeIn 0.3s ease-out",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#91a7ff" }}>
              Antwortvorschlaege erkannt
            </span>
            <button onClick={() => setReplyToast(null)} style={{
              background: "none", border: "none", color: "#5c5c75", cursor: "pointer", fontSize: "12px",
            }}>✕</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {replyToast.replies.slice(0, 3).map((r: any) => (
              <button key={r.id} onClick={() => {
                (window as any).ghostclip?.writeClipboard?.(r.text);
                setReplyToast(null);
              }} style={{
                textAlign: "left", padding: "8px 12px", borderRadius: "8px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                color: "#c4c4d4", fontSize: "12px", cursor: "pointer", lineHeight: 1.4,
              }}>
                <span style={{ fontSize: "9px", color: "#748ffc", fontWeight: 600, textTransform: "uppercase" }}>
                  {r.tone}
                </span>
                <br />{r.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clips */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {(semanticResults !== null ? semanticResults : filteredClips).map((clip) => (
          <div
            key={clip.id}
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
              border: `1px solid ${clip.pinned ? "rgba(92,124,250,0.2)" : "rgba(255,255,255,0.05)"}`,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Type + Summary */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    fontSize: "9px",
                    fontWeight: 600,
                    color: "#748ffc",
                    background: "rgba(76,110,245,0.12)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {typeEmoji[clip.type] || "?"}
                  </span>
                  <span style={{
                    fontSize: "13px",
                    color: "#e0e0e8",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {clip.summary || clip.content?.slice(0, 80) || "..."}
                  </span>
                </div>

                {/* URL preview */}
                {clip.type === "url" && clip.content && (
                  <div style={{
                    fontSize: "11px", color: "#5c7cfa", marginTop: "4px",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    cursor: "pointer", opacity: 0.7,
                  }}
                    onClick={() => (window as any).ghostclip?.openUrl?.(clip.content)}
                    title={clip.content}
                  >
                    {clip.content.length > 80 ? clip.content.slice(0, 80) + "..." : clip.content}
                  </div>
                )}

                {/* Tags */}
                {clip.tags && clip.tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                    {clip.tags.map((tag: string) => (
                      <span key={tag} style={{
                        fontSize: "10px",
                        color: "#91a7ff",
                        background: "rgba(66,99,235,0.12)",
                        border: "1px solid rgba(66,99,235,0.15)",
                        padding: "1px 7px",
                        borderRadius: "20px",
                      }}>
                        {tag}
                      </span>
                    ))}
                    {clip.mood && (
                      <span style={{
                        fontSize: "10px",
                        color: "#5c5c75",
                        fontStyle: "italic",
                        marginLeft: "4px",
                      }}>
                        {clip.mood}
                      </span>
                    )}
                  </div>
                )}

                {/* Enrichment indicator */}
                {!clip.enriched && clip.tags?.length === 0 && (
                  <div style={{ fontSize: "10px", color: "#4a4a60", marginTop: "4px" }}>
                    AI analysiert...
                  </div>
                )}
              </div>

              {/* Right side: time + actions */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", shrinkWrap: 0 }}>
                <span style={{ fontSize: "10px", color: "#4a4a60", fontFamily: "'JetBrains Mono', monospace" }}>
                  {new Date(clip.createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <div style={{ display: "flex", gap: "4px" }}>
                  {clip.type === "url" && (
                    <button onClick={() => (window as any).ghostclip?.openUrl?.(clip.content)} title="Im Browser oeffnen" style={{ ...actionBtn, color: "#22c55e" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </button>
                  )}
                  <button onClick={() => copyClip(clip.id)} title="Kopieren" style={actionBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                  <button onClick={() => pinClip(clip.id)} title="Pinnen" style={{ ...actionBtn, color: clip.pinned ? "#748ffc" : undefined, background: clip.pinned ? "rgba(92,124,250,0.12)" : undefined }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={clip.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 1 1 0 0 0 1-1V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1a1 1 0 0 0 1 1 1 1 0 0 1 1 1z"/></svg>
                  </button>
                  <button onClick={() => deleteClip(clip.id)} title="Loeschen" style={{ ...actionBtn, color: "#ef4444" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Sensitivity warning + auto-expire countdown */}
            {clip.sensitivity && ["critical", "high"].includes(clip.sensitivity) && (
              <div style={{
                fontSize: "10px",
                color: clip.sensitivity === "critical" ? "#ef4444" : "#f97316",
                marginTop: "6px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}>
                <span style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: clip.sensitivity === "critical" ? "#ef4444" : "#f97316",
                  animation: "pulse 1.5s infinite",
                }} />
                {clip.sensitivity === "critical" ? "KRITISCH" : "Sensibel"} — wird automatisch geloescht
                <AutoExpireTimer createdAt={clip.createdAt} />
              </div>
            )}
            {clip.sensitivity && clip.sensitivity !== "low" && !["critical", "high"].includes(clip.sensitivity) && (
              <div style={{ fontSize: "10px", color: "#5c5c75", marginTop: "4px" }}>
                Sensibilitaet: {clip.sensitivity}
              </div>
            )}
          </div>
        ))}

        {(semanticResults !== null ? semanticResults : filteredClips).length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#4a4a60", fontSize: "13px" }}>
            {search ? "Keine Clips gefunden" : "Kopiere etwas — es erscheint hier live!"}
          </div>
        )}
      </div>
    </div>
  );
}

function AutoExpireTimer({ createdAt }: { createdAt: string }) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    const update = () => {
      const created = new Date(createdAt).getTime();
      const expiresAt = created + 5 * 60 * 1000; // 5 min
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
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "10px",
      fontWeight: 600,
      color: remaining === "abgelaufen" ? "#ef4444" : "#f97316",
    }}>
      ({remaining})
    </span>
  );
}

const actionBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "#8888a0",
  cursor: "pointer",
  padding: "6px",
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.15s",
};

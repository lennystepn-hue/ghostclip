import React, { useState, useEffect } from "react";

interface RecentClip {
  id: string;
  type: string;
  summary: string;
  content: string;
  tags: string[];
  createdAt: string;
}

interface ReplySuggestion {
  id: string;
  text: string;
  tone: string;
}

export function FloatingWidget() {
  const [expanded, setExpanded] = useState(false);
  const [recentClips, setRecentClips] = useState<RecentClip[]>([]);
  const [replies, setReplies] = useState<ReplySuggestion[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [tab, setTab] = useState<"clips" | "replies">("clips");

  const api = (window as any).ghostclip;

  // Listen for expand/collapse from main process
  useEffect(() => {
    const handleExpand = (_: any, isExpanded: boolean) => {
      setExpanded(isExpanded);
    };
    // Use ipcRenderer via preload
    if (api?.onWidgetExpanded) {
      return api.onWidgetExpanded(handleExpand);
    }
  }, []);

  // Load recent clips when expanded
  useEffect(() => {
    if (!expanded) return;
    api?.getClips?.().then((clips: RecentClip[]) => {
      setRecentClips((clips || []).slice(0, 8));
    });
  }, [expanded]);

  // Listen for reply suggestions
  useEffect(() => {
    if (!api?.onReplySuggestions) return;
    return api.onReplySuggestions((data: any) => {
      if (data?.replies?.length > 0) {
        setReplies(data.replies.slice(0, 3));
        setTab("replies");
        // Auto-expand when replies arrive
        api?.widgetToggleExpand?.();
      }
    });
  }, []);

  // Listen for new clips
  useEffect(() => {
    if (!api?.onClipNew) return;
    return api.onClipNew((clip: RecentClip) => {
      setRecentClips((prev) => [clip, ...prev].slice(0, 8));
    });
  }, []);

  const copyToClipboard = async (text: string, id: string) => {
    await api?.writeClipboard?.(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  // Collapsed: just the floating button
  if (!expanded) {
    return (
      <div
        onClick={() => api?.widgetToggleExpand?.()}
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #4263eb, #5c7cfa)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(66,99,235,0.4), 0 0 40px rgba(92,124,250,0.15)",
          transition: "all 0.2s",
          border: "2px solid rgba(255,255,255,0.15)",
          WebkitAppRegion: "no-drag" as any,
        }}
        title="GhostClip"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
      </div>
    );
  }

  // Expanded panel
  return (
    <div style={{
      width: "356px",
      height: "416px",
      borderRadius: "16px",
      background: "rgba(15,15,20,0.92)",
      backdropFilter: "blur(24px)",
      border: "1px solid rgba(92,124,250,0.2)",
      boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(66,99,235,0.1)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.4)",
          }} />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#e0e0e8" }}>
            GhostClip
          </span>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {/* Tab buttons */}
          <button
            onClick={() => setTab("clips")}
            style={{
              padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
              background: tab === "clips" ? "rgba(66,99,235,0.2)" : "transparent",
              color: tab === "clips" ? "#91a7ff" : "#5c5c75",
              border: tab === "clips" ? "1px solid rgba(92,124,250,0.3)" : "1px solid transparent",
              cursor: "pointer",
            }}
          >
            Clips
          </button>
          <button
            onClick={() => setTab("replies")}
            style={{
              padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
              background: tab === "replies" ? "rgba(66,99,235,0.2)" : "transparent",
              color: tab === "replies" ? "#91a7ff" : "#5c5c75",
              border: tab === "replies" ? "1px solid rgba(92,124,250,0.3)" : "1px solid transparent",
              cursor: "pointer",
              position: "relative",
            }}
          >
            Antworten
            {replies.length > 0 && (
              <span style={{
                position: "absolute", top: "-4px", right: "-4px",
                width: "8px", height: "8px", borderRadius: "50%",
                background: "#ef4444", border: "2px solid rgba(15,15,20,0.92)",
              }} />
            )}
          </button>
        </div>
        <button
          onClick={() => { (window as any).ghostclip?.widgetCollapse?.(); }}
          style={{
            background: "none", border: "none", color: "#5c5c75",
            cursor: "pointer", fontSize: "16px", padding: "2px 4px",
          }}
        >
          x
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {tab === "clips" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {recentClips.length === 0 && (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "#4a4a60", fontSize: "12px" }}>
                Noch keine Clips — kopiere etwas!
              </div>
            )}
            {recentClips.map((clip) => (
              <button
                key={clip.id}
                onClick={() => copyToClipboard(clip.content, clip.id)}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: copied === clip.id
                    ? "rgba(34,197,94,0.15)"
                    : "rgba(255,255,255,0.04)",
                  border: copied === clip.id
                    ? "1px solid rgba(34,197,94,0.3)"
                    : "1px solid rgba(255,255,255,0.05)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  width: "100%",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    fontSize: "8px", fontWeight: 700, color: "#748ffc",
                    background: "rgba(76,110,245,0.12)", padding: "2px 5px",
                    borderRadius: "3px", fontFamily: "'JetBrains Mono', monospace",
                    flexShrink: 0,
                  }}>
                    {clip.type === "image" ? "IMG" : clip.type === "url" ? "URL" : "T"}
                  </span>
                  <span style={{
                    fontSize: "12px", color: copied === clip.id ? "#22c55e" : "#c4c4d4",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    flex: 1,
                  }}>
                    {copied === clip.id ? "Kopiert!" : (clip.summary || clip.content?.slice(0, 60) || "...")}
                  </span>
                  <span style={{
                    fontSize: "9px", color: "#4a4a60", flexShrink: 0,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {new Date(clip.createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {clip.tags?.length > 0 && (
                  <div style={{ display: "flex", gap: "3px", marginTop: "4px", flexWrap: "wrap" }}>
                    {clip.tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} style={{
                        fontSize: "9px", color: "#748ffc", background: "rgba(66,99,235,0.1)",
                        padding: "1px 5px", borderRadius: "10px",
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {tab === "replies" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {replies.length === 0 && (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "#4a4a60", fontSize: "12px" }}>
                Kopiere eine Nachricht — GhostClip schlaegt Antworten vor!
              </div>
            )}
            {replies.map((r) => (
              <button
                key={r.id}
                onClick={() => copyToClipboard(r.text, r.id)}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: copied === r.id
                    ? "rgba(34,197,94,0.15)"
                    : "linear-gradient(135deg, rgba(66,99,235,0.08), rgba(168,85,247,0.05))",
                  border: copied === r.id
                    ? "1px solid rgba(34,197,94,0.3)"
                    : "1px solid rgba(92,124,250,0.15)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  width: "100%",
                }}
              >
                <div style={{
                  fontSize: "9px", fontWeight: 700, color: "#748ffc",
                  textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px",
                }}>
                  {r.tone}
                </div>
                <div style={{
                  fontSize: "12px", color: copied === r.id ? "#22c55e" : "#c4c4d4",
                  lineHeight: 1.5,
                }}>
                  {copied === r.id ? "Kopiert!" : r.text}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "8px 12px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontSize: "10px", color: "#4a4a60" }}>
          Ctrl+Shift+V Quick Panel
        </span>
        <span style={{ fontSize: "10px", color: "#4a4a60" }}>
          Ctrl+Shift+R Antworten
        </span>
      </div>
    </div>
  );
}

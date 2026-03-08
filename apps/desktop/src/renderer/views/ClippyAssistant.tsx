import React, { useState, useEffect, useRef, useCallback } from "react";
import { getRandomTip } from "../clippy/clippy-data";

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

export function ClippyAssistant() {
  const [expanded, setExpanded] = useState(false);
  const [recentClips, setRecentClips] = useState<RecentClip[]>([]);
  const [replies, setReplies] = useState<ReplySuggestion[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [tab, setTab] = useState<"clips" | "replies">("clips");
  const [speechText, setSpeechText] = useState<string | null>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const speechTimeout = useRef<any>(null);
  const typewriterRef = useRef<any>(null);

  const api = (window as any).ghostclip;

  // Typewriter effect for speech bubble
  useEffect(() => {
    if (!speechText) {
      setDisplayedText("");
      return;
    }
    setDisplayedText("");
    let i = 0;
    typewriterRef.current = setInterval(() => {
      i++;
      setDisplayedText(speechText.slice(0, i));
      if (i >= speechText.length) {
        clearInterval(typewriterRef.current);
      }
    }, 30);
    return () => clearInterval(typewriterRef.current);
  }, [speechText]);

  // Show speech bubble with auto-hide
  const showSpeech = useCallback((text: string, duration = 6000) => {
    if (speechTimeout.current) clearTimeout(speechTimeout.current);
    setSpeechText(text);
    setIsAnimating(true);
    speechTimeout.current = setTimeout(() => {
      setSpeechText(null);
      setIsAnimating(false);
    }, duration);
  }, []);

  // Show idle tip periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!expanded && !speechText) {
        if (Math.random() < 0.3) {
          showSpeech(getRandomTip("idle"), 8000);
        }
      }
    }, 45000);
    return () => clearInterval(interval);
  }, [expanded, speechText, showSpeech]);

  // Listen for expand/collapse
  useEffect(() => {
    if (!api?.onWidgetExpanded) return;
    return api.onWidgetExpanded((_: any, isExp: boolean) => setExpanded(isExp));
  }, []);

  // Load clips when expanded
  useEffect(() => {
    if (!expanded) return;
    api?.getClips?.().then((clips: RecentClip[]) => {
      setRecentClips((clips || []).slice(0, 8));
    });
  }, [expanded]);

  // Listen for new clips — trigger Clippy reaction
  useEffect(() => {
    if (!api?.onClipNew) return;
    return api.onClipNew((clip: RecentClip) => {
      setRecentClips((prev) => [clip, ...prev].slice(0, 8));
      showSpeech(getRandomTip(clip.type || "text"), 5000);
    });
  }, [showSpeech]);

  // Listen for reply suggestions
  useEffect(() => {
    if (!api?.onReplySuggestions) return;
    return api.onReplySuggestions((data: any) => {
      if (data?.replies?.length > 0) {
        setReplies(data.replies.slice(0, 3));
        setTab("replies");
        showSpeech("Ich hab Antwort-Vorschlaege fuer dich!", 5000);
        api?.widgetToggleExpand?.();
      }
    });
  }, [showSpeech]);

  const copyToClipboard = async (text: string, id: string) => {
    await api?.writeClipboard?.(text);
    setCopied(id);
    showSpeech("Kopiert! Einfach einfuegen mit Ctrl+V", 3000);
    setTimeout(() => setCopied(null), 1500);
  };

  const onMouseEnter = () => api?.widgetMouseEnter?.();
  const onMouseLeave = () => api?.widgetMouseLeave?.();

  // === COLLAPSED STATE: Clippy character ===
  if (!expanded) {
    return (
      <div
        style={{
          width: "140px",
          height: "120px",
          position: "relative",
          WebkitAppRegion: "no-drag" as any,
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Speech Bubble */}
        {speechText && (
          <div style={{
            position: "absolute",
            bottom: "105px",
            right: "10px",
            background: "#FFFFC8",
            border: "2px solid #333",
            borderRadius: "12px",
            padding: "10px 14px",
            maxWidth: "220px",
            fontSize: "12px",
            color: "#222",
            fontFamily: "'Segoe UI', 'Microsoft Sans Serif', sans-serif",
            boxShadow: "2px 2px 8px rgba(0,0,0,0.15)",
            lineHeight: 1.4,
            zIndex: 10,
          }}>
            {displayedText}
            {/* Arrow pointing down */}
            <div style={{
              position: "absolute",
              bottom: "-10px",
              right: "30px",
              width: 0, height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "10px solid #333",
            }} />
            <div style={{
              position: "absolute",
              bottom: "-7px",
              right: "31px",
              width: 0, height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderTop: "9px solid #FFFFC8",
            }} />
          </div>
        )}

        {/* Clippy Character — SVG paperclip with eyes */}
        <div
          onClick={() => api?.widgetToggleExpand?.()}
          style={{
            position: "absolute",
            bottom: 0,
            right: "8px",
            width: "80px",
            height: "100px",
            cursor: "pointer",
          }}
          title="Klick mich!"
        >
          <svg
            viewBox="0 0 80 100"
            width="80"
            height="100"
            style={{
              filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.2))",
              animation: isAnimating
                ? "clippy-bounce 0.5s ease-in-out"
                : "clippy-idle 3s ease-in-out infinite",
            }}
          >
            {/* Paperclip wire body */}
            <path
              d="M 35 95 C 35 95, 15 85, 15 60 C 15 35, 25 20, 40 15 C 55 10, 65 20, 65 35 C 65 50, 55 65, 45 70 C 35 75, 28 65, 28 55 C 28 45, 35 35, 42 32"
              fill="none"
              stroke="#8B8B8B"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Shiny highlight */}
            <path
              d="M 35 95 C 35 95, 15 85, 15 60 C 15 35, 25 20, 40 15"
              fill="none"
              stroke="#C0C0C0"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Left eye */}
            <ellipse cx="36" cy="28" rx="7" ry="9" fill="white" stroke="#555" strokeWidth="1.5" />
            <ellipse cx="37" cy="29" rx="3.5" ry="4.5" fill="#333"
              style={{ animation: "clippy-blink 4s ease-in-out infinite" }} />
            <ellipse cx="38" cy="27" rx="1.5" ry="2" fill="white" />
            {/* Right eye */}
            <ellipse cx="52" cy="28" rx="7" ry="9" fill="white" stroke="#555" strokeWidth="1.5" />
            <ellipse cx="53" cy="29" rx="3.5" ry="4.5" fill="#333"
              style={{ animation: "clippy-blink 4s ease-in-out infinite" }} />
            <ellipse cx="54" cy="27" rx="1.5" ry="2" fill="white" />
            {/* Eyebrows */}
            <path d="M 30 20 Q 36 17, 42 20" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 46 20 Q 52 17, 58 20" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
          </svg>

          <style>{`
            @keyframes clippy-idle {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-3px); }
            }
            @keyframes clippy-bounce {
              0% { transform: translateY(0) rotate(0deg); }
              25% { transform: translateY(-8px) rotate(-5deg); }
              50% { transform: translateY(0) rotate(0deg); }
              75% { transform: translateY(-4px) rotate(3deg); }
              100% { transform: translateY(0) rotate(0deg); }
            }
            @keyframes clippy-blink {
              0%, 45%, 55%, 100% { transform: scaleY(1); }
              50% { transform: scaleY(0.1); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // === EXPANDED STATE: Panel ===
  return (
    <div style={{
      width: "416px",
      height: "496px",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        flex: 1,
        borderRadius: "16px",
        background: "rgba(15,15,20,0.95)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(92,124,250,0.2)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(66,99,235,0.1)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
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
            <span style={{ fontSize: "18px" }}>&#x1F4CE;</span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#e0e0e8" }}>
              Clippy Assistent
            </span>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              onClick={() => setTab("clips")}
              style={{
                padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
                background: tab === "clips" ? "rgba(66,99,235,0.2)" : "transparent",
                color: tab === "clips" ? "#91a7ff" : "#5c5c75",
                border: tab === "clips" ? "1px solid rgba(92,124,250,0.3)" : "1px solid transparent",
                cursor: "pointer",
              }}
            >Clips</button>
            <button
              onClick={() => setTab("replies")}
              style={{
                padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
                background: tab === "replies" ? "rgba(66,99,235,0.2)" : "transparent",
                color: tab === "replies" ? "#91a7ff" : "#5c5c75",
                border: tab === "replies" ? "1px solid rgba(92,124,250,0.3)" : "1px solid transparent",
                cursor: "pointer", position: "relative",
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
            onClick={() => api?.widgetCollapse?.()}
            style={{
              background: "none", border: "none", color: "#5c5c75",
              cursor: "pointer", fontSize: "16px", padding: "2px 4px",
            }}
          >&#x2715;</button>
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
                    textAlign: "left", padding: "10px 12px", borderRadius: "10px",
                    background: copied === clip.id ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)",
                    border: copied === clip.id ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.05)",
                    cursor: "pointer", transition: "all 0.15s", width: "100%",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      fontSize: "8px", fontWeight: 700, color: "#748ffc",
                      background: "rgba(76,110,245,0.12)", padding: "2px 5px",
                      borderRadius: "3px", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
                    }}>
                      {clip.type === "image" ? "IMG" : clip.type === "url" ? "URL" : clip.type === "file" ? "FILE" : "T"}
                    </span>
                    <span style={{
                      fontSize: "12px", color: copied === clip.id ? "#22c55e" : "#c4c4d4",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
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
                      {clip.tags.slice(0, 3).map((tag) => (
                        <span key={tag} style={{
                          fontSize: "9px", color: "#748ffc", background: "rgba(66,99,235,0.1)",
                          padding: "1px 5px", borderRadius: "10px",
                        }}>{tag}</span>
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
                  Kopiere eine Nachricht — ich schlage dir Antworten vor!
                </div>
              )}
              {replies.map((r) => (
                <button
                  key={r.id}
                  onClick={() => copyToClipboard(r.text, r.id)}
                  style={{
                    textAlign: "left", padding: "12px 14px", borderRadius: "10px",
                    background: copied === r.id ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg, rgba(66,99,235,0.08), rgba(168,85,247,0.05))",
                    border: copied === r.id ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(92,124,250,0.15)",
                    cursor: "pointer", transition: "all 0.15s", width: "100%",
                  }}
                >
                  <div style={{
                    fontSize: "9px", fontWeight: 700, color: "#748ffc",
                    textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px",
                  }}>{r.tone}</div>
                  <div style={{
                    fontSize: "12px", color: copied === r.id ? "#22c55e" : "#c4c4d4", lineHeight: 1.5,
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
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: "10px", color: "#4a4a60" }}>Ctrl+Shift+V Quick Panel</span>
          <span style={{ fontSize: "10px", color: "#4a4a60" }}>Ctrl+Shift+R Antworten</span>
        </div>
      </div>
    </div>
  );
}

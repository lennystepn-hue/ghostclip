import React, { useState, useEffect, useRef, useCallback } from "react";
import { CLIPPY_FRAMES, FRAME_W, FRAME_H, IDLE_ANIMATIONS, getRandomTip } from "../clippy/clippy-data";

// Clippy sprite sheet — loaded as static asset via Vite
// @ts-ignore - PNG import handled by Vite
import clippyMap from "../../../resources/clippy-map.png";

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

// Sprite animation hook
function useClippyAnimation() {
  const [frameX, setFrameX] = useState(0);
  const [frameY, setFrameY] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<any>(null);
  const queueRef = useRef<string[]>([]);
  const playingRef = useRef(false);

  const playAnimation = useCallback((name: string) => {
    const frames = CLIPPY_FRAMES[name];
    if (!frames) return;

    playingRef.current = true;
    let i = 0;

    const next = () => {
      if (i >= frames.length) {
        playingRef.current = false;
        // Play next queued or idle
        if (queueRef.current.length > 0) {
          playAnimation(queueRef.current.shift()!);
        }
        return;
      }
      const frame = frames[i];
      if (frame.x === -1) {
        setVisible(false);
      } else {
        setVisible(true);
        setFrameX(frame.x);
        setFrameY(frame.y);
      }
      i++;
      timerRef.current = setTimeout(next, frame.d);
    };
    next();
  }, []);

  const play = useCallback((name: string) => {
    if (playingRef.current) {
      queueRef.current.push(name);
    } else {
      playAnimation(name);
    }
  }, [playAnimation]);

  const playIdle = useCallback(() => {
    const name = IDLE_ANIMATIONS[Math.floor(Math.random() * IDLE_ANIMATIONS.length)];
    play(name);
  }, [play]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return { frameX, frameY, visible, play, playIdle };
}

export function ClippyAssistant() {
  const [expanded, setExpanded] = useState(false);
  const [recentClips, setRecentClips] = useState<RecentClip[]>([]);
  const [replies, setReplies] = useState<ReplySuggestion[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [tab, setTab] = useState<"clips" | "replies">("clips");
  const [speechText, setSpeechText] = useState<string | null>(null);
  const [displayedText, setDisplayedText] = useState("");
  const speechTimeout = useRef<any>(null);
  const typewriterRef = useRef<any>(null);

  const { frameX, frameY, visible, play, playIdle } = useClippyAnimation();
  const api = (window as any).ghostclip;

  // Typewriter effect
  useEffect(() => {
    if (!speechText) { setDisplayedText(""); return; }
    setDisplayedText("");
    let i = 0;
    typewriterRef.current = setInterval(() => {
      i++;
      setDisplayedText(speechText.slice(0, i));
      if (i >= speechText.length) clearInterval(typewriterRef.current);
    }, 30);
    return () => clearInterval(typewriterRef.current);
  }, [speechText]);

  const showSpeech = useCallback((text: string, animName?: string, duration = 6000) => {
    if (speechTimeout.current) clearTimeout(speechTimeout.current);
    setSpeechText(text);
    if (animName) play(animName);
    speechTimeout.current = setTimeout(() => setSpeechText(null), duration);
  }, [play]);

  // Periodic idle animations
  useEffect(() => {
    const interval = setInterval(() => {
      if (!expanded) {
        playIdle();
        if (Math.random() < 0.2) {
          showSpeech(getRandomTip("idle"), undefined, 8000);
        }
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [expanded, playIdle, showSpeech]);

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

  // New clip → Clippy reacts (with AI comment if available)
  useEffect(() => {
    if (!api?.onClipNew) return;
    return api.onClipNew((clip: RecentClip) => {
      setRecentClips((prev) => [clip, ...prev].slice(0, 8));
      // Show a quick static tip first, AI comment will replace it
      showSpeech(getRandomTip(clip.type || "text"), "Wave", 5000);
    });
  }, [showSpeech]);

  // AI-generated Clippy comments (sent from main process)
  useEffect(() => {
    if (!api?.onClippyComment) return;
    return api.onClippyComment((comment: string) => {
      if (comment) showSpeech(comment, "Thinking", 8000);
    });
  }, [showSpeech]);

  // Reply suggestions
  useEffect(() => {
    if (!api?.onReplySuggestions) return;
    return api.onReplySuggestions((data: any) => {
      if (data?.replies?.length > 0) {
        setReplies(data.replies.slice(0, 3));
        setTab("replies");
        showSpeech("Ich hab Antwort-Vorschlaege fuer dich!", "GetAttention", 5000);
        api?.widgetToggleExpand?.();
      }
    });
  }, [showSpeech]);

  const copyToClipboard = async (text: string, id: string) => {
    await api?.writeClipboard?.(text);
    setCopied(id);
    showSpeech("Kopiert! Einfach einfuegen mit Ctrl+V", "Congratulate", 3000);
    setTimeout(() => setCopied(null), 1500);
  };


  // === COLLAPSED: Clippy character with speech bubble ===
  if (!expanded) {
    return (
      <div
        style={{
          width: "260px",
          height: "280px",
          position: "relative",
          WebkitAppRegion: "no-drag" as any,
          overflow: "visible",
        }}
      >
        {/* Speech Bubble — positioned above Clippy */}
        {speechText && (
          <div style={{
            position: "absolute",
            bottom: `${FRAME_H + 20}px`,
            right: "20px",
            background: "#FFFFC8",
            border: "2px solid #333",
            borderRadius: "12px",
            padding: "10px 14px",
            maxWidth: "230px",
            minWidth: "120px",
            fontSize: "12px",
            color: "#222",
            fontFamily: "'Segoe UI', 'Microsoft Sans Serif', sans-serif",
            boxShadow: "2px 2px 8px rgba(0,0,0,0.2)",
            lineHeight: 1.4,
            zIndex: 10,
            whiteSpace: "pre-wrap",
          }}>
            {displayedText}
            {/* Arrow */}
            <div style={{
              position: "absolute", bottom: "-10px", right: "40px",
              width: 0, height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "10px solid #333",
            }} />
            <div style={{
              position: "absolute", bottom: "-7px", right: "41px",
              width: 0, height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderTop: "9px solid #FFFFC8",
            }} />
          </div>
        )}

        {/* Clippy Sprite — original! */}
        <div
          onClick={() => api?.widgetToggleExpand?.()}
          style={{
            position: "absolute",
            bottom: "0",
            right: "20px",
            width: `${FRAME_W}px`,
            height: `${FRAME_H}px`,
            backgroundImage: `url(${clippyMap})`,
            backgroundPosition: `-${frameX}px -${frameY}px`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "3348px 3162px",
            imageRendering: "auto",
            cursor: "pointer",
            visibility: visible ? "visible" : "hidden",
          }}
          title="Klick mich fuer deine Clips!"
        />
      </div>
    );
  }

  // === EXPANDED: Panel with Clippy at bottom ===
  return (
    <div style={{
      width: "416px",
      height: "536px",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'DM Sans', sans-serif",
      position: "relative",
    }}>
      {/* Panel */}
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
        marginBottom: `${FRAME_H - 10}px`,
      }}>
        {/* Header */}
        <div style={{
          padding: "12px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: `${FRAME_W * 0.25}px`, height: `${FRAME_H * 0.25}px`,
              backgroundImage: `url(${clippyMap})`,
              backgroundPosition: "0 0", backgroundRepeat: "no-repeat",
              backgroundSize: `${3348 * 0.25}px ${3162 * 0.25}px`,
            }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#e0e0e8" }}>
              Clippy Assistent
            </span>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button onClick={() => setTab("clips")} style={{
              padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
              background: tab === "clips" ? "rgba(66,99,235,0.2)" : "transparent",
              color: tab === "clips" ? "#91a7ff" : "#5c5c75",
              border: tab === "clips" ? "1px solid rgba(92,124,250,0.3)" : "1px solid transparent",
              cursor: "pointer",
            }}>Clips</button>
            <button onClick={() => setTab("replies")} style={{
              padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
              background: tab === "replies" ? "rgba(66,99,235,0.2)" : "transparent",
              color: tab === "replies" ? "#91a7ff" : "#5c5c75",
              border: tab === "replies" ? "1px solid rgba(92,124,250,0.3)" : "1px solid transparent",
              cursor: "pointer", position: "relative",
            }}>
              Antworten
              {replies.length > 0 && <span style={{
                position: "absolute", top: "-4px", right: "-4px",
                width: "8px", height: "8px", borderRadius: "50%",
                background: "#ef4444", border: "2px solid rgba(15,15,20,0.92)",
              }} />}
            </button>
          </div>
          <button onClick={() => api?.widgetCollapse?.()} style={{
            background: "none", border: "none", color: "#5c5c75",
            cursor: "pointer", fontSize: "16px", padding: "2px 4px",
          }}>✕</button>
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
                <button key={clip.id} onClick={() => copyToClipboard(clip.content, clip.id)} style={{
                  textAlign: "left", padding: "10px 12px", borderRadius: "10px",
                  background: copied === clip.id ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)",
                  border: copied === clip.id ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.05)",
                  cursor: "pointer", transition: "all 0.15s", width: "100%",
                }}>
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
                <button key={r.id} onClick={() => copyToClipboard(r.text, r.id)} style={{
                  textAlign: "left", padding: "12px 14px", borderRadius: "10px",
                  background: copied === r.id ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg, rgba(66,99,235,0.08), rgba(168,85,247,0.05))",
                  border: copied === r.id ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(92,124,250,0.15)",
                  cursor: "pointer", transition: "all 0.15s", width: "100%",
                }}>
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
          padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: "10px", color: "#4a4a60" }}>Ctrl+Shift+V Quick Panel</span>
          <span style={{ fontSize: "10px", color: "#4a4a60" }}>Ctrl+Shift+R Antworten</span>
        </div>
      </div>

      {/* Clippy sprite at bottom-right of expanded panel */}
      <div style={{
        position: "absolute",
        bottom: "0",
        right: "20px",
        width: `${FRAME_W}px`,
        height: `${FRAME_H}px`,
        backgroundImage: `url(${clippyMap})`,
        backgroundPosition: `-${frameX}px -${frameY}px`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "3348px 3162px",
        visibility: visible ? "visible" : "hidden",
      }} />
    </div>
  );
}

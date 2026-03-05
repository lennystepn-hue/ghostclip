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
                <div style={{ display: "flex", gap: "2px" }}>
                  <button onClick={() => copyClip(clip.id)} title="Kopieren" style={actionBtn}>C</button>
                  <button onClick={() => pinClip(clip.id)} title="Pinnen" style={{ ...actionBtn, color: clip.pinned ? "#748ffc" : undefined }}>P</button>
                  <button onClick={() => deleteClip(clip.id)} title="Loeschen" style={{ ...actionBtn, color: "#ef4444" }}>X</button>
                </div>
              </div>
            </div>

            {/* Sensitivity warning */}
            {clip.sensitivity && clip.sensitivity !== "low" && (
              <div style={{
                fontSize: "10px",
                color: clip.sensitivity === "critical" ? "#ef4444" : "#f97316",
                marginTop: "4px",
              }}>
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

const actionBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#5c5c75",
  cursor: "pointer",
  fontSize: "10px",
  fontWeight: 600,
  padding: "2px 5px",
  borderRadius: "4px",
  fontFamily: "'JetBrains Mono', monospace",
};

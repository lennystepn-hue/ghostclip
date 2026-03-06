import React, { useState, useEffect } from "react";

export function SmartView() {
  const [clips, setClips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const api = (window as any).ghostclip;
    api?.getClips?.().then((all: any[]) => {
      // Smart sorting: enriched first, then by tag count + sensitivity
      const scored = (all || [])
        .filter((c: any) => !c.archived && c.enriched)
        .map((c: any) => ({
          ...c,
          score: (c.tags?.length || 0) * 2
            + (c.pinned ? 10 : 0)
            + (c.sensitivity === "critical" ? 5 : c.sensitivity === "high" ? 3 : 0)
            + (c.mood ? 1 : 0),
        }))
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 30);
      setClips(scored);
      setLoading(false);
    });
  }, []);

  const copyClip = (content: string) => {
    const api = (window as any).ghostclip;
    api?.writeClipboard?.(content);
  };

  if (loading) return <div style={{ padding: "40px", color: "#5c5c75", textAlign: "center" }}>Laden...</div>;

  return (
    <div>
      <p style={{ fontSize: "12px", color: "#5c5c75", marginBottom: "16px" }}>
        AI-kuratiert nach Relevanz, Sensibilitaet und Haeufigkeit
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {clips.map(clip => (
          <div key={clip.id} style={{
            padding: "12px 16px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            border: `1px solid ${clip.sensitivity === "critical" ? "rgba(239,68,68,0.2)" : clip.sensitivity === "high" ? "rgba(249,115,22,0.2)" : clip.pinned ? "rgba(92,124,250,0.2)" : "rgba(255,255,255,0.05)"}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    fontSize: "9px", fontWeight: 600, color: "#748ffc",
                    background: "rgba(76,110,245,0.12)", padding: "2px 6px",
                    borderRadius: "4px", fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {clip.type?.toUpperCase()}
                  </span>
                  {clip.sensitivity && clip.sensitivity !== "low" && (
                    <span style={{
                      fontSize: "9px", fontWeight: 600,
                      color: clip.sensitivity === "critical" ? "#ef4444" : "#f97316",
                      background: clip.sensitivity === "critical" ? "rgba(239,68,68,0.12)" : "rgba(249,115,22,0.12)",
                      padding: "2px 6px", borderRadius: "4px",
                    }}>
                      {clip.sensitivity}
                    </span>
                  )}
                  {clip.pinned && <span style={{ fontSize: "9px", color: "#748ffc" }}>📌</span>}
                  <span style={{ fontSize: "13px", color: "#e0e0e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {clip.summary || clip.content?.slice(0, 80)}
                  </span>
                </div>
                {clip.tags?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                    {clip.tags.map((tag: string) => (
                      <span key={tag} style={{
                        fontSize: "10px", color: "#91a7ff",
                        background: "rgba(66,99,235,0.12)",
                        border: "1px solid rgba(66,99,235,0.15)",
                        padding: "1px 7px", borderRadius: "20px",
                      }}>{tag}</span>
                    ))}
                    {clip.mood && <span style={{ fontSize: "10px", color: "#5c5c75", fontStyle: "italic", marginLeft: "4px" }}>{clip.mood}</span>}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "4px", marginLeft: "8px" }}>
                <button onClick={() => copyClip(clip.content)} style={{
                  background: "rgba(66,99,235,0.1)", border: "1px solid rgba(92,124,250,0.15)",
                  color: "#748ffc", padding: "4px 10px", borderRadius: "6px",
                  fontSize: "10px", cursor: "pointer", fontWeight: 600,
                }}>Kopieren</button>
              </div>
            </div>
          </div>
        ))}
        {clips.length === 0 && (
          <div style={{ color: "#4a4a60", fontSize: "13px", padding: "40px", textAlign: "center" }}>
            Noch keine Smart Clips — kopiere mehr und die AI lernt was wichtig ist!
          </div>
        )}
      </div>
    </div>
  );
}

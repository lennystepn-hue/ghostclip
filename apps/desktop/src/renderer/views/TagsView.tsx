import React, { useState, useEffect } from "react";

export function TagsView() {
  const [tags, setTags] = useState<{tag: string; count: number}[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [clips, setClips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const api = (window as any).ghostclip;
    api?.getTags?.().then((t: any) => { setTags(t || []); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!selectedTag) { setClips([]); return; }
    const api = (window as any).ghostclip;
    api?.getClipsByTag?.(selectedTag).then((c: any) => setClips(c || []));
  }, [selectedTag]);

  const maxCount = Math.max(...tags.map(t => t.count), 1);

  if (loading) return <div style={{ padding: "40px", color: "#5c5c75", textAlign: "center" }}>Laden...</div>;

  return (
    <div>
      {selectedTag && (
        <div style={{ fontSize: "14px", fontWeight: 500, color: "#748ffc", marginBottom: "16px" }}>
          {selectedTag}
        </div>
      )}

      {!selectedTag ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {tags.map(({ tag, count }) => {
            const intensity = 0.3 + (count / maxCount) * 0.7;
            const size = 12 + (count / maxCount) * 8;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                style={{
                  background: `rgba(66,99,235,${0.08 + intensity * 0.15})`,
                  border: `1px solid rgba(92,124,250,${0.1 + intensity * 0.2})`,
                  color: `rgba(145,167,255,${0.6 + intensity * 0.4})`,
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: `${size}px`,
                  cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                  transition: "all 0.2s",
                }}
              >
                {tag} <span style={{ opacity: 0.5, fontSize: "10px" }}>{count}</span>
              </button>
            );
          })}
          {tags.length === 0 && (
            <div style={{ color: "#4a4a60", fontSize: "13px", padding: "40px", textAlign: "center", width: "100%" }}>
              Noch keine Tags — kopiere etwas und die AI taggt es automatisch!
            </div>
          )}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setSelectedTag(null)}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#748ffc",
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              cursor: "pointer",
              marginBottom: "16px",
            }}
          >
            ← Alle Tags
          </button>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {clips.map(clip => (
              <div key={clip.id} style={{
                padding: "12px 16px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                border: "1px solid rgba(255,255,255,0.05)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "#e0e0e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {clip.summary || clip.content?.slice(0, 80)}
                  </span>
                  <span style={{ fontSize: "10px", color: "#4a4a60", fontFamily: "'JetBrains Mono', monospace", marginLeft: "12px" }}>
                    {new Date(clip.createdAt).toLocaleDateString("de-DE")}
                  </span>
                </div>
                {clip.tags?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                    {clip.tags.map((t: string) => (
                      <span key={t} onClick={() => setSelectedTag(t)} style={{
                        fontSize: "10px",
                        color: t === selectedTag ? "#e0e0e8" : "#91a7ff",
                        background: t === selectedTag ? "rgba(66,99,235,0.3)" : "rgba(66,99,235,0.12)",
                        border: "1px solid rgba(66,99,235,0.15)",
                        padding: "1px 7px",
                        borderRadius: "20px",
                        cursor: "pointer",
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

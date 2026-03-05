import React, { useState, useEffect, useCallback } from "react";

export function QuickPanelView() {
  const [clips, setClips] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const api = (window as any).ghostclip;
    api?.getClips?.().then((c: any) => setClips((c || []).slice(0, 20)));
  }, []);

  const filtered = search
    ? clips.filter(c =>
        c.summary?.toLowerCase().includes(search.toLowerCase()) ||
        c.tags?.some((t: string) => t.toLowerCase().includes(search.toLowerCase())) ||
        c.content?.toLowerCase().includes(search.toLowerCase())
      )
    : clips;

  const paste = useCallback((clip: any) => {
    const api = (window as any).ghostclip;
    api?.writeClipboard?.(clip.content || clip.summary || "");
    api?.close?.();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        paste(filtered[selectedIndex]);
      } else if (e.key === "Escape") {
        (window as any).ghostclip?.close?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered, selectedIndex, paste]);

  useEffect(() => { setSelectedIndex(0); }, [search]);

  return (
    <div style={{
      width: "100%",
      height: "100%",
      background: "rgba(15,15,20,0.95)",
      backdropFilter: "blur(20px)",
      borderRadius: "16px",
      border: "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
    }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Suchen und einfuegen..."
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(34,34,46,0.6)",
            color: "#e0e0e8",
            fontSize: "13px",
            outline: "none",
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
        {filtered.map((clip, i) => (
          <div
            key={clip.id}
            onClick={() => paste(clip)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              background: i === selectedIndex ? "rgba(66,99,235,0.15)" : "transparent",
              border: i === selectedIndex ? "1px solid rgba(92,124,250,0.2)" : "1px solid transparent",
              cursor: "pointer",
              marginBottom: "2px",
            }}
          >
            <div style={{
              fontSize: "12px",
              color: "#e0e0e8",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {clip.summary || clip.content?.slice(0, 80)}
            </div>
            {clip.tags?.length > 0 && (
              <div style={{ display: "flex", gap: "4px", marginTop: "3px" }}>
                {clip.tags.slice(0, 4).map((tag: string) => (
                  <span key={tag} style={{
                    fontSize: "9px",
                    color: "#91a7ff",
                    background: "rgba(66,99,235,0.12)",
                    padding: "1px 5px",
                    borderRadius: "10px",
                  }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{
        padding: "8px 16px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        fontSize: "10px",
        color: "#4a4a60",
        display: "flex",
        justifyContent: "space-between",
      }}>
        <span>navigieren</span>
        <span>Enter einfuegen</span>
        <span>Esc schliessen</span>
      </div>
    </div>
  );
}

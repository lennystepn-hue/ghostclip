import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { fuzzyMatch, parseFilterQuery, confidenceColor, confidenceLabel } from "@ghostclip/shared";
import type { Prediction } from "@ghostclip/shared";

// ── Constants ──────────────────────────────────────────────────────────────────

const LAST_SEARCH_KEY = "ghostclip:quickpanel:lastSearch";

const TRANSFORM_MODES = [
  { id: "shorter",      label: "Make shorter",          icon: "✂" },
  { id: "formal",       label: "Make formal",            icon: "👔" },
  { id: "translate_en", label: "Translate to English",   icon: "🌐" },
  { id: "translate_de", label: "Translate to German",    icon: "🇩🇪" },
  { id: "explain",      label: "Explain",                icon: "💡" },
  { id: "summarize",    label: "Summarize",              icon: "📝" },
];

// Content-type icon helper
function clipIcon(type: string | undefined): string {
  if (type === "url")   return "🔗";
  if (type === "image") return "🖼";
  return "📄";
}

// ── Keyboard hint badge ────────────────────────────────────────────────────────

const kbdStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "1px 5px",
  borderRadius: "3px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#4a4a60",
  fontFamily: "inherit",
  fontSize: "inherit",
};

// ── Main component ─────────────────────────────────────────────────────────────

export function QuickPanelView() {
  const [clips, setClips] = useState<any[]>([]);
  const [search, setSearch] = useState<string>(() => {
    try { return localStorage.getItem(LAST_SEARCH_KEY) || ""; } catch { return ""; }
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Set of clip IDs chosen for multi-paste
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Whether the inline transform menu is open
  const [transformOpen, setTransformOpen] = useState(false);
  const [transforming, setTransforming] = useState(false);

  const [predictions, setPredictions] = useState<Prediction[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);

  // ── Load clips + predictions ───────────────────────────────────────────────

  useEffect(() => {
    const api = (window as any).ghostclip;
    api?.getClips?.().then((c: any) => {
      setClips((c || []).filter((x: any) => !x.archived));
    });
    api?.getPredictions?.().then((p: Prediction[]) => {
      setPredictions(p || []);
    });
  }, []);

  // ── Parsed filter chips ──────────────────────────────────────────────────────

  const parsed = useMemo(() => parseFilterQuery(search), [search]);

  // ── Filtered clip list ───────────────────────────────────────────────────────

  const filtered = useMemo<any[]>(() => {
    let list = clips;

    if (parsed.tag) {
      list = list.filter((c) =>
        c.tags?.some((t: string) => t.toLowerCase().includes(parsed.tag!))
      );
    }
    if (parsed.app) {
      list = list.filter((c) =>
        c.sourceApp?.toLowerCase().includes(parsed.app!)
      );
    }
    if (parsed.type) {
      const typeAliases: Record<string, string[]> = {
        url:   ["url"],
        image: ["image"],
        text:  ["text"],
        code:  ["code", "text"],
      };
      const allowed = typeAliases[parsed.type] ?? [parsed.type];
      list = list.filter((c) => allowed.includes((c.type ?? "text").toLowerCase()));
    }
    if (parsed.query) {
      list = list.filter((c) => {
        const haystack = [
          c.content  ?? "",
          c.summary  ?? "",
          ...(c.tags ?? []),
        ].join(" ");
        return fuzzyMatch(haystack, parsed.query);
      });
    }

    return list;
  }, [clips, parsed]);

  // Predicted clip IDs for visual marking
  const predictedIds = useMemo(() => new Set(predictions.map((p) => p.clipId)), [predictions]);
  const predictionMap = useMemo(() => {
    const m = new Map<string, Prediction>();
    for (const p of predictions) m.set(p.clipId, p);
    return m;
  }, [predictions]);

  // Prepend predicted clips to the top of the list (when no search)
  const { displayList, predictedClipCount } = useMemo(() => {
    if (search || predictions.length === 0) return { displayList: filtered, predictedClipCount: 0 };
    const predictedClips = predictions
      .map((p) => clips.find((c) => c.id === p.clipId))
      .filter((c): c is (typeof clips)[number] => c != null);
    const predictedIdSet = new Set(predictedClips.map((c) => c.id));
    const rest = filtered.filter((c) => !predictedIdSet.has(c.id));
    return { displayList: [...predictedClips, ...rest], predictedClipCount: predictedClips.length };
  }, [filtered, predictions, clips, search]);

  // Currently highlighted clip (drives the preview pane)
  const highlightedClip: any = displayList[selectedIndex] ?? null;

  // ── Persistence ──────────────────────────────────────────────────────────────

  useEffect(() => {
    try { localStorage.setItem(LAST_SEARCH_KEY, search); } catch {}
  }, [search]);

  // Reset cursor, multi-select, and transform overlay when search changes
  useEffect(() => {
    setSelectedIndex(0);
    setSelectedIds(new Set());
    setTransformOpen(false);
  }, [search]);

  // ── Scroll active item into view ─────────────────────────────────────────────

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-qp-idx="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // ── Paste helpers ─────────────────────────────────────────────────────────────

  const pasteClips = useCallback(async (ids: Set<string> | null) => {
    const api = (window as any).ghostclip;
    const toPaste =
      ids && ids.size > 0
        ? clips.filter((c) => ids.has(c.id))
        : highlightedClip
        ? [highlightedClip]
        : [];
    if (toPaste.length === 0) return;
    const content = toPaste.map((c) => c.content || c.summary || "").join("\n\n");
    await api?.writeClipboard?.(content);
    // Record paste for predictive learning
    for (const c of toPaste) {
      api?.recordPaste?.(c.id);
    }
    api?.close?.();
  }, [clips, highlightedClip]);

  // ── AI transform ─────────────────────────────────────────────────────────────

  const handleTransform = useCallback(async (mode: string) => {
    const api = (window as any).ghostclip;
    if (!highlightedClip) return;
    setTransforming(true);
    try {
      const result = await api?.aiTransform?.(highlightedClip.content ?? "", mode);
      if (result) {
        await api?.writeClipboard?.(result);
        api?.close?.();
      }
    } finally {
      setTransforming(false);
      setTransformOpen(false);
    }
  }, [highlightedClip]);

  // ── Keyboard handler ─────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // When transform menu is open only allow Escape to close it
      if (transformOpen) {
        if (e.key === "Escape") { e.preventDefault(); setTransformOpen(false); }
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      if (e.key === "Escape") {
        e.preventDefault();
        (window as any).ghostclip?.close?.();
        return;
      }

      // Ctrl+T → open inline transform for the highlighted clip
      if (ctrl && e.key === "t") {
        e.preventDefault();
        if (highlightedClip) setTransformOpen(true);
        return;
      }

      // Ctrl+↑ / Ctrl+↓ — jump through history 5 at a time
      if (ctrl && e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 5, displayList.length - 1));
        return;
      }
      if (ctrl && e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 5, 0));
        return;
      }

      // ↑ / ↓ — single-step navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, displayList.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }

      // Shift+Enter — toggle current clip into/out of multi-select
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        if (!highlightedClip) return;
        const id = highlightedClip.id;
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
        return;
      }

      // Enter — paste (multi if any selected, else highlighted)
      if (e.key === "Enter") {
        e.preventDefault();
        pasteClips(selectedIds.size > 0 ? selectedIds : null);
        return;
      }

      // Alt+1-9 — quick-paste clip at that position
      if (!ctrl && e.altKey && /^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (displayList[idx]) {
          e.preventDefault();
          pasteClips(new Set([displayList[idx].id]));
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [displayList, highlightedClip, pasteClips, selectedIds, transformOpen]);

  // ── Active filter chip descriptors ───────────────────────────────────────────

  const filterChips: { label: string; onRemove: () => void }[] = [];
  if (parsed.tag) {
    filterChips.push({
      label: `#${parsed.tag}`,
      onRemove: () => setSearch((s) => s.replace(/#\S+/g, "").trim()),
    });
  }
  if (parsed.app) {
    filterChips.push({
      label: `@${parsed.app}`,
      onRemove: () => setSearch((s) => s.replace(/@\S+/g, "").trim()),
    });
  }
  if (parsed.type) {
    const prefix =
      parsed.type === "url"   ? "u:" :
      parsed.type === "image" ? "i:" :
      `t:${parsed.type}`;
    filterChips.push({
      label: prefix,
      onRemove: () => setSearch((s) => s.replace(/[tui]:\S+/i, "").trim()),
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{
      width: "100%",
      height: "100%",
      background: "rgba(12,12,18,0.97)",
      backdropFilter: "blur(24px) saturate(180%)",
      borderRadius: "16px",
      border: "1px solid rgba(255,255,255,0.07)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 32px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(92,124,250,0.08)",
      position: "relative",
    }}>

      {/* ── Search bar ────────────────────────────────────────────────── */}
      <div style={{
        padding: "12px 16px 8px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: "#5c5c75", flexShrink: 0 }}>⌕</span>
          <input
            ref={inputRef}
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clips...  #tag  @app  t:text  u:url  i:image"
            style={{
              flex: 1,
              padding: "6px 0",
              border: "none",
              background: "transparent",
              color: "#e0e0e8",
              fontSize: "14px",
              outline: "none",
              fontFamily: "inherit",
            }}
            spellCheck={false}
            autoComplete="off"
          />
          {search && (
            <button
              onMouseDown={(e) => { e.preventDefault(); setSearch(""); inputRef.current?.focus(); }}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "none",
                color: "#5c5c75",
                cursor: "pointer",
                borderRadius: "4px",
                padding: "2px 7px",
                fontSize: "10px",
              }}
            >
              clear
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {filterChips.length > 0 && (
          <div style={{ display: "flex", gap: "5px", marginTop: "6px", flexWrap: "wrap" }}>
            {filterChips.map((chip) => (
              <span
                key={chip.label}
                onClick={chip.onRemove}
                title="Click to remove filter"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  fontSize: "11px",
                  color: "#91a7ff",
                  background: "rgba(66,99,235,0.15)",
                  border: "1px solid rgba(92,124,250,0.2)",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                {chip.label} <span style={{ opacity: 0.6 }}>×</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Body: clip list + preview pane ─────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* Clip list */}
        <div
          ref={listRef}
          style={{
            width: "300px",
            minWidth: "260px",
            overflowY: "auto",
            padding: "4px 6px",
            borderRight: "1px solid rgba(255,255,255,0.05)",
            flexShrink: 0,
          }}
        >
          {displayList.length === 0 && (
            <div style={{
              padding: "40px 16px",
              textAlign: "center",
              color: "#3a3a52",
              fontSize: "12px",
            }}>
              No clips found
            </div>
          )}

          {/* Ghost suggestion header for predicted clips */}
          {!search && predictedClipCount > 0 && (
            <div style={{
              padding: "4px 10px 2px",
              fontSize: "9px",
              color: "#5c5c75",
              fontWeight: 700,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              opacity: 0.7,
            }}>
              You might need...
            </div>
          )}

          {displayList.map((clip, i) => {
            const isHighlighted  = i === selectedIndex;
            const isMultiPicked  = selectedIds.has(clip.id);
            const isPredicted    = predictedIds.has(clip.id);
            const prediction     = predictionMap.get(clip.id);
            // Show separator between predicted and regular clips
            const showSeparator  = !search && predictedClipCount > 0 && i === predictedClipCount
              && i < displayList.length;

            return (
              <React.Fragment key={clip.id}>
                {showSeparator && (
                  <div style={{
                    height: "1px",
                    background: "rgba(255,255,255,0.06)",
                    margin: "4px 8px",
                  }} />
                )}
                <div
                  data-qp-idx={i}
                  onMouseEnter={() => setSelectedIndex(i)}
                  onClick={() => pasteClips(selectedIds.size > 0 ? selectedIds : new Set([clip.id]))}
                  style={{
                    padding: "7px 10px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    marginBottom: "2px",
                    position: "relative",
                    background:
                      isMultiPicked   ? "rgba(66,235,99,0.08)"  :
                      isPredicted && isHighlighted ? "rgba(74,222,128,0.12)" :
                      isHighlighted   ? "rgba(66,99,235,0.15)"  :
                      isPredicted     ? "rgba(74,222,128,0.04)" : "transparent",
                    border:
                      isMultiPicked   ? "1px solid rgba(66,235,99,0.25)" :
                      isPredicted && isHighlighted ? "1px solid rgba(74,222,128,0.25)" :
                      isHighlighted   ? "1px solid rgba(92,124,250,0.22)" :
                      isPredicted     ? "1px solid rgba(74,222,128,0.1)" : "1px solid transparent",
                    transition: "background 0.08s, border-color 0.08s",
                  }}
                >
                  {/* Numbered shortcut badge (1-9) */}
                  {i < 9 && (
                    <span style={{
                      position: "absolute",
                      right: "6px",
                      top: "6px",
                      fontSize: "9px",
                      color: "#3a3a52",
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: "3px",
                      padding: "1px 4px",
                      fontFamily: "monospace",
                    }}>
                      {i + 1}
                    </span>
                  )}

                  {/* Confidence indicator for predicted clips */}
                  {isPredicted && prediction && (
                    <span style={{
                      position: "absolute",
                      right: i < 9 ? "28px" : "6px",
                      top: "6px",
                      fontSize: "8px",
                      color: confidenceColor(prediction.confidence),
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: "3px",
                      padding: "1px 4px",
                      fontWeight: 600,
                    }}>
                      {confidenceLabel(prediction.confidence)}
                    </span>
                  )}

                  <div style={{
                    fontSize: "12px",
                    color: isHighlighted ? "#d0d0e8" : "#a0a0b8",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    paddingRight: i < 9 ? (isPredicted ? "60px" : "22px") : (isPredicted ? "40px" : "0"),
                  }}>
                    {clipIcon(clip.type)}{" "}
                    {clip.summary || clip.content?.slice(0, 120)}
                  </div>

                  {clip.tags?.length > 0 && (
                    <div style={{ display: "flex", gap: "3px", marginTop: "3px", flexWrap: "wrap" }}>
                      {clip.tags.slice(0, 5).map((tag: string) => (
                        <span key={tag} style={{
                          fontSize: "9px",
                          color: "#91a7ff",
                          background: "rgba(66,99,235,0.1)",
                          padding: "1px 5px",
                          borderRadius: "10px",
                        }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Preview pane */}
        <div style={{
          flex: 1,
          padding: "14px 16px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          minWidth: 0,
        }}>
          {highlightedClip ? (
            <>
              {/* Header row */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "10px",
                color: "#4a4a60",
                fontWeight: 700,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                marginBottom: "2px",
              }}>
                Preview
                {highlightedClip.type && (
                  <span style={{
                    color: "#5c7cfa",
                    background: "rgba(66,99,235,0.12)",
                    borderRadius: "4px",
                    padding: "1px 6px",
                    textTransform: "none",
                    letterSpacing: 0,
                    fontWeight: 500,
                  }}>
                    {highlightedClip.type}
                  </span>
                )}
              </div>

              {/* Full content */}
              <div style={{
                fontSize: "12px",
                color: "#b0b0c8",
                lineHeight: "1.65",
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
                overflowY: "auto",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "8px",
                padding: "10px 12px",
                border: "1px solid rgba(255,255,255,0.04)",
                flex: 1,
                maxHeight: "280px",
              }}>
                {highlightedClip.content || highlightedClip.summary || "(no content)"}
              </div>

              {/* Tags */}
              {highlightedClip.tags?.length > 0 && (
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {highlightedClip.tags.map((tag: string) => (
                    <span key={tag} style={{
                      fontSize: "10px",
                      color: "#91a7ff",
                      background: "rgba(66,99,235,0.1)",
                      border: "1px solid rgba(92,124,250,0.15)",
                      padding: "2px 7px",
                      borderRadius: "10px",
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Metadata */}
              <div style={{ fontSize: "10px", color: "#3a3a52", marginTop: "2px" }}>
                {highlightedClip.createdAt &&
                  new Date(highlightedClip.createdAt).toLocaleString()}
                {highlightedClip.sourceApp && (
                  <span style={{ marginLeft: "8px" }}>
                    from {highlightedClip.sourceApp}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3a3a52",
              fontSize: "12px",
            }}>
              Select a clip to preview
            </div>
          )}
        </div>
      </div>

      {/* ── Inline transform overlay (Ctrl+T) ──────────────────────────── */}
      {transformOpen && highlightedClip && (
        <div style={{
          position: "absolute",
          bottom: "44px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "240px",
          background: "rgba(16,16,26,0.99)",
          border: "1px solid rgba(92,124,250,0.25)",
          borderRadius: "12px",
          boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
          padding: "6px",
          zIndex: 100,
        }}>
          <div style={{
            fontSize: "10px",
            color: "#4a4a60",
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            padding: "4px 10px 6px",
          }}>
            {transforming ? "Transforming…" : "Transform clip"}
          </div>
          {TRANSFORM_MODES.map((mode) => (
            <div
              key={mode.id}
              onClick={() => !transforming && handleTransform(mode.id)}
              style={{
                padding: "7px 12px",
                borderRadius: "8px",
                cursor: transforming ? "not-allowed" : "pointer",
                fontSize: "12px",
                color: transforming ? "#3a3a52" : "#b0b0c8",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "background 0.08s",
              }}
              onMouseEnter={(e) => {
                if (!transforming)
                  (e.currentTarget as HTMLElement).style.background = "rgba(66,99,235,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <span>{mode.icon}</span>
              {mode.label}
            </div>
          ))}
        </div>
      )}

      {/* ── Footer hints ────────────────────────────────────────────────── */}
      <div style={{
        padding: "7px 14px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        fontSize: "10px",
        color: "#3a3a52",
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <span><kbd style={kbdStyle}>↑↓</kbd> navigate</span>
        <span><kbd style={kbdStyle}>↵</kbd> paste</span>
        <span><kbd style={kbdStyle}>⇧↵</kbd> multi-select</span>
        <span><kbd style={kbdStyle}>^T</kbd> transform</span>
        <span><kbd style={kbdStyle}>⌥1–9</kbd> quick paste</span>
        <span><kbd style={kbdStyle}>^↑↓</kbd> jump</span>
        <span><kbd style={kbdStyle}>esc</kbd> close</span>
        {selectedIds.size > 0 && (
          <span style={{ marginLeft: "auto", color: "#5c7cfa", fontWeight: 600 }}>
            {selectedIds.size} selected
          </span>
        )}
      </div>
    </div>
  );
}

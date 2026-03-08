import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface CommandItem {
  id: string;
  category: "nav" | "clip" | "collection" | "template" | "command" | "ai" | "tag";
  label: string;
  sub?: string;
  icon: string;
  /** Data passed to the action handler */
  payload?: any;
  action: () => void | Promise<void>;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

// ── Fuzzy match ───────────────────────────────────────────────────────────────

function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

// ── Recently-used helpers ─────────────────────────────────────────────────────

const RECENT_KEY = "ghostclip:cmd:recent";
const MAX_RECENT = 5;

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function pushRecent(id: string) {
  const prev = getRecent().filter((r) => r !== id);
  localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...prev].slice(0, MAX_RECENT)));
}

// ── Navigation items ──────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "nav:clips", label: "Clips", icon: "📋", view: "clips" },
  { id: "nav:pinboard", label: "Pin Board", icon: "📌", view: "pinboard" },
  { id: "nav:tags", label: "Tags", icon: "🏷", view: "tags" },
  { id: "nav:collections", label: "Collections", icon: "📁", view: "collections" },
  { id: "nav:smart", label: "Smart View", icon: "🔮", view: "smart" },
  { id: "nav:chat", label: "Chat", icon: "💬", view: "chat" },
  { id: "nav:analytics", label: "Analytics", icon: "📊", view: "analytics" },
  { id: "nav:settings", label: "Settings", icon: "⚙", view: "settings" },
  { id: "nav:account", label: "Account", icon: "👤", view: "account" },
];

// ── AI action labels ──────────────────────────────────────────────────────────

const AI_ACTIONS = [
  { id: "ai:summarize", label: "Summarize last 5 clips", icon: "📝", mode: "summarize_recent" },
  { id: "ai:translate_en", label: "Translate clipboard to English", icon: "🌐", mode: "translate_en" },
  { id: "ai:translate_de", label: "Translate clipboard to German", icon: "🇩🇪", mode: "translate_de" },
  { id: "ai:shorter", label: "Make clipboard shorter", icon: "✂", mode: "shorter" },
  { id: "ai:formal", label: "Make clipboard more formal", icon: "👔", mode: "formal" },
  { id: "ai:explain", label: "Explain clipboard content", icon: "💡", mode: "explain" },
];

// ── Category heading ──────────────────────────────────────────────────────────

function CategoryHeading({ label }: { label: string }) {
  return (
    <div style={{
      padding: "6px 14px 4px",
      fontSize: "10px",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#4a4a60",
    }}>
      {label}
    </div>
  );
}

// ── Result row ────────────────────────────────────────────────────────────────

function ResultRow({ item, active, index, onSelect, onHover }: {
  item: CommandItem;
  active: boolean;
  index: number;
  onSelect: () => void;
  onHover: () => void;
}) {
  return (
    <div
      data-index={index}
      onMouseEnter={onHover}
      onMouseDown={(e) => { e.preventDefault(); onSelect(); }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 14px",
        borderRadius: "8px",
        margin: "1px 6px",
        cursor: "pointer",
        background: active ? "rgba(92,124,250,0.15)" : "transparent",
        border: active ? "1px solid rgba(92,124,250,0.2)" : "1px solid transparent",
        transition: "all 0.1s",
      }}
    >
      <span style={{ fontSize: "15px", flexShrink: 0 }}>{item.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "13px",
          color: active ? "#c4c4d4" : "#a0a0b8",
          fontWeight: active ? 500 : 400,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {item.label}
        </div>
        {item.sub && (
          <div style={{
            fontSize: "11px",
            color: "#5c5c75",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: "1px",
          }}>
            {item.sub}
          </div>
        )}
      </div>
      <span style={{
        fontSize: "9px",
        fontWeight: 600,
        color: "#3a3a52",
        background: "rgba(255,255,255,0.04)",
        padding: "2px 6px",
        borderRadius: "4px",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        flexShrink: 0,
      }}>
        {item.category}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CommandPalette({ open, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [clips, setClips] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load data when palette opens
  useEffect(() => {
    if (!open) return;
    const api = (window as any).ghostclip;
    if (!api) return;

    setQuery("");
    setActiveIndex(0);

    Promise.all([
      api.getClips?.().catch(() => []),
      api.getCollections?.().catch(() => []),
      api.getTemplates?.().catch(() => []),
      api.getTags?.().catch(() => []),
    ]).then(([c, col, tmpl, t]) => {
      setClips(c || []);
      setCollections(col || []);
      setTemplates(tmpl || []);
      // getTags returns objects with { tag, count }
      setTags(
        (t || []).map((tag: any) => (typeof tag === "string" ? tag : tag.tag)).filter(Boolean)
      );
    });
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Determine prefix mode
  const prefixMode: "command" | "tag" | "search" | null = useMemo(() => {
    if (query.startsWith(">")) return "command";
    if (query.startsWith("@")) return "tag";
    if (query.startsWith("/")) return "search";
    return null;
  }, [query]);

  const rawQuery = useMemo(() => {
    if (prefixMode) return query.slice(1).trimStart();
    return query;
  }, [query, prefixMode]);

  // Build flat list of all items
  const allItems: CommandItem[] = useMemo(() => {
    const api = (window as any).ghostclip;
    const items: CommandItem[] = [];

    // Navigation
    for (const nav of NAV_ITEMS) {
      items.push({
        id: nav.id,
        category: "nav",
        label: nav.label,
        icon: nav.icon,
        action: () => { onNavigate(nav.view); onClose(); },
      });
    }

    // Clips (non-archived, up to 50)
    for (const clip of clips.filter((c) => !c.archived).slice(0, 50)) {
      const label = clip.summary || clip.content?.slice(0, 80) || "Untitled clip";
      const sub = clip.tags?.join(", ");
      items.push({
        id: `clip:${clip.id}`,
        category: "clip",
        label,
        sub,
        icon: clip.type === "url" ? "🔗" : clip.type === "image" ? "🖼" : "📄",
        payload: clip,
        action: async () => {
          await api?.writeClipboard?.(clip.content || clip.summary || "");
          onClose();
        },
      });
      // Clip actions
      items.push({
        id: `clip:pin:${clip.id}`,
        category: "command",
        label: `${clip.pinned ? "Unpin" : "Pin"} clip: ${label.slice(0, 40)}`,
        icon: "📌",
        payload: clip,
        action: async () => { await api?.pinClip?.(clip.id); onClose(); },
      });
      items.push({
        id: `clip:archive:${clip.id}`,
        category: "command",
        label: `Archive clip: ${label.slice(0, 40)}`,
        icon: "📦",
        payload: clip,
        action: async () => { await api?.archiveClip?.(clip.id); onClose(); },
      });
      items.push({
        id: `clip:delete:${clip.id}`,
        category: "command",
        label: `Delete clip: ${label.slice(0, 40)}`,
        icon: "🗑",
        payload: clip,
        action: async () => { await api?.deleteClip?.(clip.id); onClose(); },
      });
    }

    // Collections
    for (const col of collections) {
      items.push({
        id: `collection:${col.id}`,
        category: "collection",
        label: `${col.icon || "📁"} ${col.name}`,
        sub: `Collection`,
        icon: col.icon || "📁",
        payload: col,
        action: () => { onNavigate("collections"); onClose(); },
      });
    }

    // Templates
    for (const tmpl of templates) {
      items.push({
        id: `template:${tmpl.id}`,
        category: "template",
        label: tmpl.name,
        sub: tmpl.category || "Template",
        icon: "📋",
        payload: tmpl,
        action: async () => {
          await api?.useTemplate?.(tmpl.id, {});
          onClose();
        },
      });
    }

    // Tags
    for (const tag of tags) {
      items.push({
        id: `tag:${tag}`,
        category: "tag",
        label: `#${tag}`,
        sub: "Browse by tag",
        icon: "🏷",
        action: () => { onNavigate("tags"); onClose(); },
      });
    }

    // AI actions
    for (const ai of AI_ACTIONS) {
      items.push({
        id: ai.id,
        category: "ai",
        label: ai.label,
        icon: ai.icon,
        action: async () => {
          if (ai.mode === "summarize_recent") {
            onNavigate("chat");
          } else {
            // Transform clipboard content
            const text = await navigator.clipboard.readText().catch(() => "");
            if (text) await api?.aiTransform?.(text, ai.mode);
          }
          onClose();
        },
      });
    }

    return items;
  }, [clips, collections, templates, tags, onNavigate, onClose]);

  // Filter items based on query + prefix mode
  const filteredItems: CommandItem[] = useMemo(() => {
    if (!rawQuery && !prefixMode) return [];

    let pool = allItems;

    if (prefixMode === "command") {
      pool = allItems.filter((i) => i.category === "command" || i.category === "nav" || i.category === "ai");
    } else if (prefixMode === "tag") {
      pool = allItems.filter((i) => i.category === "tag");
    } else if (prefixMode === "search") {
      pool = allItems.filter((i) => i.category === "clip" && !i.id.includes(":pin:") && !i.id.includes(":archive:") && !i.id.includes(":delete:"));
    }

    if (!rawQuery) return pool.slice(0, 30);

    return pool.filter((item) => {
      const searchText = [item.label, item.sub || "", item.category].join(" ");
      return fuzzyMatch(searchText, rawQuery);
    }).slice(0, 30);
  }, [allItems, rawQuery, prefixMode]);

  // Recently used items shown when query is empty
  const recentItems: CommandItem[] = useMemo(() => {
    if (query) return [];
    const recent = getRecent();
    return recent
      .map((id) => allItems.find((item) => item.id === id))
      .filter(Boolean) as CommandItem[];
  }, [query, allItems]);

  // Group filtered items by category for display
  type Section = { heading: string; items: CommandItem[] };
  const sections: Section[] = useMemo(() => {
    if (!query && recentItems.length > 0) {
      return [{ heading: "Recent", items: recentItems }];
    }
    if (!query) {
      // Default: show nav + AI actions
      return [
        { heading: "Navigation", items: allItems.filter((i) => i.category === "nav") },
        { heading: "AI Actions", items: allItems.filter((i) => i.category === "ai") },
      ].filter((s) => s.items.length > 0);
    }

    const groups: Record<string, CommandItem[]> = {};
    for (const item of filteredItems) {
      // Collapse clip sub-actions (pin/archive/delete) under "command"
      const cat = item.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }

    const catLabels: Record<string, string> = {
      nav: "Navigation",
      clip: "Clips",
      collection: "Collections",
      template: "Templates",
      command: "Commands",
      ai: "AI Actions",
      tag: "Tags",
    };

    return Object.entries(groups).map(([cat, items]) => ({
      heading: catLabels[cat] || cat,
      items,
    }));
  }, [query, filteredItems, recentItems, allItems]);

  // Flat list for keyboard index tracking
  const flatItems: CommandItem[] = useMemo(
    () => sections.flatMap((s) => s.items),
    [sections]
  );

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Scroll active row into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleSelect = useCallback((item: CommandItem) => {
    pushRecent(item.id);
    item.action();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[activeIndex];
      if (item) handleSelect(item);
    }
  }, [flatItems, activeIndex, handleSelect, onClose]);

  if (!open) return null;

  const showEmpty = query.length > 0 && flatItems.length === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9000,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(2px)",
          animation: "cpFadeIn 0.12s ease",
        }}
      />

      {/* Palette panel */}
      <div
        style={{
          position: "fixed",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9001,
          width: "min(600px, 90vw)",
          background: "rgba(18,18,28,0.97)",
          border: "1px solid rgba(92,124,250,0.2)",
          borderRadius: "16px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(92,124,250,0.08)",
          overflow: "hidden",
          animation: "cpSlideIn 0.15s ease",
        }}
      >
        {/* Search input */}
        <div style={{
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          gap: "10px",
        }}>
          {/* Mode indicator */}
          <span style={{ fontSize: "16px", color: "#5c5c75", flexShrink: 0 }}>
            {prefixMode === "command" ? ">" : prefixMode === "tag" ? "@" : "⌘"}
          </span>

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              prefixMode === "command" ? "Type a command..." :
              prefixMode === "tag" ? "Search tags..." :
              prefixMode === "search" ? "Search clips..." :
              "Search clips, commands, AI actions...  > commands  @ tags"
            }
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#e0e0e8",
              fontSize: "15px",
              padding: "16px 0",
              fontFamily: "inherit",
            }}
            autoComplete="off"
            spellCheck={false}
          />

          {query && (
            <button
              onMouseDown={(e) => { e.preventDefault(); setQuery(""); inputRef.current?.focus(); }}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "none",
                color: "#5c5c75",
                cursor: "pointer",
                borderRadius: "6px",
                padding: "3px 7px",
                fontSize: "11px",
                flexShrink: 0,
              }}
            >
              esc
            </button>
          )}
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{
            maxHeight: "400px",
            overflowY: "auto",
            padding: "6px 0 8px",
          }}
        >
          {showEmpty && (
            <div style={{
              textAlign: "center",
              padding: "32px 20px",
              color: "#4a4a60",
              fontSize: "13px",
            }}>
              No results for &ldquo;{rawQuery}&rdquo;
            </div>
          )}

          {!showEmpty && (() => {
            let globalIndex = 0;
            return sections.map((section) => (
              <div key={section.heading}>
                <CategoryHeading label={section.heading} />
                {section.items.map((item) => {
                  const idx = globalIndex++;
                  return (
                    <ResultRow
                      key={item.id}
                      item={item}
                      index={idx}
                      active={activeIndex === idx}
                      onSelect={() => handleSelect(item)}
                      onHover={() => setActiveIndex(idx)}
                    />
                  );
                })}
              </div>
            ));
          })()}
        </div>

        {/* Footer hints */}
        <div style={{
          display: "flex",
          gap: "16px",
          padding: "8px 16px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          fontSize: "10px",
          color: "#3a3a52",
        }}>
          <span><kbd style={kbdStyle}>↑↓</kbd> navigate</span>
          <span><kbd style={kbdStyle}>↵</kbd> select</span>
          <span><kbd style={kbdStyle}>esc</kbd> close</span>
          <span style={{ marginLeft: "auto" }}><kbd style={kbdStyle}>&gt;</kbd> commands &nbsp; <kbd style={kbdStyle}>@</kbd> tags</span>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes cpFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cpSlideIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.97); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)     scale(1);    }
        }
      `}</style>
    </>
  );
}

const kbdStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "1px 5px",
  borderRadius: "4px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#5c5c75",
  fontFamily: "inherit",
};

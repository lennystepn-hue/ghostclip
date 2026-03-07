import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { extractVariables } from "@ghostclip/shared";

// Re-export so SettingsView can import from a single renderer-side path
export { extractVariables };

// ── Types ─────────────────────────────────────────────────────────────────────

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
  useCount: number;
}

interface TemplatePickerProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = ["Alle", "Email", "Code", "Support", "Allgemein"];

// ── Main component ────────────────────────────────────────────────────────────

export function TemplatePicker({ open, onClose }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Alle");
  const [activeIndex, setActiveIndex] = useState(0);
  // Variable fill step: null = browse, Template = filling variables
  const [filling, setFilling] = useState<Template | null>(null);
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [copyStatus, setCopyStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load templates when opened
  useEffect(() => {
    if (!open) return;
    const api = (window as any).ghostclip;
    setQuery("");
    setActiveCategory("Alle");
    setActiveIndex(0);
    setFilling(null);
    setVarValues({});
    setCopyStatus("");
    api?.getTemplates?.().then((tmpl: Template[]) => setTemplates(tmpl || []));
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  // Filter templates by search query and category
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return templates.filter((t) => {
      const matchesCategory = activeCategory === "Alle" || t.category.toLowerCase() === activeCategory.toLowerCase();
      const matchesQuery = !q || t.name.toLowerCase().includes(q) || t.content.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [templates, query, activeCategory]);

  // Reset active index when filtered list changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query, activeCategory]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Handle selecting a template from the list
  const handleSelectTemplate = useCallback((tmpl: Template) => {
    const vars = extractVariables(tmpl.content);
    if (vars.length === 0) {
      // No variables — use immediately
      applyTemplate(tmpl, {});
    } else {
      // Show variable fill form
      setFilling(tmpl);
      const initial: Record<string, string> = {};
      for (const v of vars) initial[v] = "";
      setVarValues(initial);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply template: call IPC, copy result to clipboard, show status, close
  const applyTemplate = async (tmpl: Template, variables: Record<string, string>) => {
    const api = (window as any).ghostclip;
    const result: string | null = await api?.useTemplate?.(tmpl.id, variables);
    if (result) {
      await api?.writeClipboard?.(result);
      setCopyStatus("Copied to clipboard!");
      // Refresh use count in local state
      setTemplates(prev => prev.map(t => t.id === tmpl.id ? { ...t, useCount: t.useCount + 1 } : t));
      setTimeout(() => {
        setCopyStatus("");
        onClose();
      }, 800);
    }
  };

  // Submit variable fill form
  const handleFillSubmit = () => {
    if (!filling) return;
    applyTemplate(filling, varValues);
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (filling) {
        setFilling(null);
      } else {
        onClose();
      }
      return;
    }
    if (filling) return; // Let the fill form handle its own keys

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const tmpl = filtered[activeIndex];
      if (tmpl) handleSelectTemplate(tmpl);
    }
  }, [filtered, activeIndex, filling, handleSelectTemplate, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => filling ? setFilling(null) : onClose()}
        style={{
          position: "fixed", inset: 0, zIndex: 9000,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)",
          animation: "tpFadeIn 0.12s ease",
        }}
      />

      {/* Picker panel */}
      <div
        style={{
          position: "fixed", top: "12%", left: "50%", transform: "translateX(-50%)",
          zIndex: 9001, width: "min(640px, 92vw)",
          background: "rgba(18,18,28,0.97)",
          border: "1px solid rgba(92,124,250,0.2)",
          borderRadius: "16px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(92,124,250,0.08)",
          overflow: "hidden",
          animation: "tpSlideIn 0.15s ease",
        }}
        onKeyDown={handleKeyDown}
      >
        {filling ? (
          // ── Variable fill step ─────────────────────────────────────────────
          <VarFillPanel
            template={filling}
            varValues={varValues}
            onVarChange={(k, v) => setVarValues(prev => ({ ...prev, [k]: v }))}
            onSubmit={handleFillSubmit}
            onBack={() => setFilling(null)}
            copyStatus={copyStatus}
          />
        ) : (
          // ── Browse step ────────────────────────────────────────────────────
          <>
            {/* Search input */}
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "0 16px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
              <span style={{ fontSize: "16px", color: "#5c5c75", flexShrink: 0 }}>📋</span>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search templates by name or content..."
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "#e0e0e8", fontSize: "15px", padding: "16px 0", fontFamily: "inherit",
                }}
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button
                  onMouseDown={e => { e.preventDefault(); setQuery(""); inputRef.current?.focus(); }}
                  style={{
                    background: "rgba(255,255,255,0.06)", border: "none", color: "#5c5c75",
                    cursor: "pointer", borderRadius: "6px", padding: "3px 7px", fontSize: "11px",
                  }}
                >esc</button>
              )}
            </div>

            {/* Category filter */}
            <div style={{
              display: "flex", gap: "6px", padding: "8px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              overflowX: "auto",
            }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                    cursor: "pointer", whiteSpace: "nowrap",
                    background: activeCategory === cat ? "rgba(92,124,250,0.2)" : "rgba(255,255,255,0.04)",
                    border: activeCategory === cat ? "1px solid rgba(92,124,250,0.3)" : "1px solid rgba(255,255,255,0.06)",
                    color: activeCategory === cat ? "#748ffc" : "#5c5c75",
                  }}
                >{cat}</button>
              ))}
            </div>

            {/* Template list */}
            <div
              ref={listRef}
              style={{ maxHeight: "380px", overflowY: "auto", padding: "6px 0 8px" }}
            >
              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 20px", color: "#4a4a60", fontSize: "13px" }}>
                  {templates.length === 0 ? "No templates yet. Create one in Settings." : "No templates match your search."}
                </div>
              ) : (
                filtered.map((tmpl, idx) => (
                  <TemplateRow
                    key={tmpl.id}
                    template={tmpl}
                    index={idx}
                    active={activeIndex === idx}
                    onSelect={() => handleSelectTemplate(tmpl)}
                    onHover={() => setActiveIndex(idx)}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{
              display: "flex", gap: "16px", padding: "8px 16px",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              fontSize: "10px", color: "#3a3a52",
            }}>
              <span><kbd style={kbdStyle}>↑↓</kbd> navigate</span>
              <span><kbd style={kbdStyle}>↵</kbd> use template</span>
              <span><kbd style={kbdStyle}>esc</kbd> close</span>
              <span style={{ marginLeft: "auto" }}>
                {filtered.length} template{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes tpFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tpSlideIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.97); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)     scale(1);    }
        }
      `}</style>
    </>
  );
}

// ── Template row ──────────────────────────────────────────────────────────────

function TemplateRow({ template, index, active, onSelect, onHover }: {
  template: Template; index: number; active: boolean;
  onSelect: () => void; onHover: () => void;
}) {
  const vars = extractVariables(template.content);
  const preview = template.content.slice(0, 80).replace(/\n/g, " ") + (template.content.length > 80 ? "…" : "");

  return (
    <div
      data-index={index}
      onMouseEnter={onHover}
      onMouseDown={e => { e.preventDefault(); onSelect(); }}
      style={{
        display: "flex", alignItems: "flex-start", gap: "10px",
        padding: "10px 14px", borderRadius: "8px", margin: "1px 6px",
        cursor: "pointer",
        background: active ? "rgba(92,124,250,0.15)" : "transparent",
        border: active ? "1px solid rgba(92,124,250,0.2)" : "1px solid transparent",
        transition: "all 0.1s",
      }}
    >
      <span style={{ fontSize: "18px", flexShrink: 0, marginTop: "1px" }}>📄</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
          <span style={{ fontSize: "13px", color: active ? "#c4c4d4" : "#a0a0b8", fontWeight: active ? 600 : 500 }}>
            {template.name}
          </span>
          <span style={{
            fontSize: "10px", fontWeight: 600, color: "#4a4a70",
            background: "rgba(255,255,255,0.04)", padding: "1px 6px", borderRadius: "10px",
          }}>{template.category}</span>
          {template.useCount > 0 && (
            <span style={{ fontSize: "10px", color: "#4a4a60", marginLeft: "auto" }}>
              used {template.useCount}×
            </span>
          )}
        </div>
        <div style={{ fontSize: "11px", color: "#4a4a60", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {preview}
        </div>
        {vars.length > 0 && (
          <div style={{ marginTop: "4px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {vars.map(v => (
              <span key={v} style={{
                fontSize: "10px", fontFamily: "'JetBrains Mono', monospace",
                color: "#748ffc", background: "rgba(66,99,235,0.1)",
                border: "1px solid rgba(66,99,235,0.15)", padding: "1px 5px", borderRadius: "4px",
              }}>{`{${v}}`}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Variable fill panel ───────────────────────────────────────────────────────

function VarFillPanel({ template, varValues, onVarChange, onSubmit, onBack, copyStatus }: {
  template: Template; varValues: Record<string, string>;
  onVarChange: (key: string, value: string) => void;
  onSubmit: () => void; onBack: () => void; copyStatus: string;
}) {
  const vars = extractVariables(template.content);
  // Build live preview by substituting current values
  const preview = vars.reduce((text, v) => {
    const val = varValues[v] || `{${v}}`;
    return text.replace(new RegExp(`\\{${v}\\}`, "g"), val);
  }, template.content);

  const firstInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setTimeout(() => firstInputRef.current?.focus(), 30);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div style={{ padding: "16px 20px" }} onKeyDown={handleKeyDown}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
        <button
          onClick={onBack}
          style={{
            background: "none", border: "none", color: "#5c5c75", cursor: "pointer",
            fontSize: "16px", padding: "0 4px",
          }}
          title="Back"
        >←</button>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#e0e0e8" }}>{template.name}</span>
        <span style={{ fontSize: "11px", color: "#4a4a70", marginLeft: "auto" }}>Fill in variables</span>
      </div>

      {/* Variable inputs */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
        {vars.map((v, i) => (
          <div key={v} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{
              fontSize: "12px", fontFamily: "'JetBrains Mono', monospace",
              color: "#748ffc", minWidth: "100px", flexShrink: 0,
            }}>{`{${v}}`}</label>
            <input
              ref={i === 0 ? firstInputRef : undefined}
              value={varValues[v] ?? ""}
              onChange={e => onVarChange(v, e.target.value)}
              placeholder={v}
              style={{
                flex: 1, padding: "7px 10px", borderRadius: "8px", fontSize: "12px",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                color: "#e0e0e8", outline: "none",
              }}
            />
          </div>
        ))}
      </div>

      {/* Live preview */}
      <div style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "8px", padding: "10px 12px", marginBottom: "14px",
        maxHeight: "120px", overflowY: "auto",
      }}>
        <p style={{ fontSize: "10px", color: "#4a4a60", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Preview
        </p>
        <pre style={{
          fontSize: "11px", color: "#c4c4d4", whiteSpace: "pre-wrap", wordBreak: "break-word",
          fontFamily: "inherit", margin: 0,
        }}>{preview}</pre>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button
          onClick={onSubmit}
          style={{
            flex: 1, padding: "9px 16px", borderRadius: "9px", fontSize: "13px", fontWeight: 600,
            cursor: "pointer", background: "rgba(66,99,235,0.2)", border: "1px solid rgba(66,99,235,0.3)",
            color: "#748ffc",
          }}
        >
          {copyStatus || "Use Template  (Ctrl+Enter)"}
        </button>
        <button
          onClick={onBack}
          style={{
            padding: "9px 14px", borderRadius: "9px", fontSize: "12px", cursor: "pointer",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#5c5c75",
          }}
        >Cancel</button>
      </div>
    </div>
  );
}

const kbdStyle: React.CSSProperties = {
  display: "inline-block", padding: "1px 5px", borderRadius: "4px",
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
  color: "#5c5c75", fontFamily: "inherit",
};

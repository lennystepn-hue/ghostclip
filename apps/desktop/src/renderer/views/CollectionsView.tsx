import React, { useState, useEffect } from "react";

interface SmartRule {
  tag?: string;
  type?: string;
  mood?: string;
  contains?: string;
  maxAge?: string;
}

const SMART_PRESETS: { name: string; icon: string; rule: SmartRule }[] = [
  { name: "Alle Links", icon: "🔗", rule: { type: "url" } },
  { name: "Code Snippets", icon: "💻", rule: { type: "text", contains: "function" } },
  { name: "Diese Woche", icon: "📅", rule: { maxAge: "7 days" } },
  { name: "Nachrichten", icon: "💬", rule: { mood: "kommunikation" } },
  { name: "Arbeit", icon: "💼", rule: { tag: "arbeit" } },
  { name: "Sensible Daten", icon: "🔒", rule: { mood: "sensitiv" } },
];

export function CollectionsView() {
  const [collections, setCollections] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showSmart, setShowSmart] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📁");
  const [smartRule, setSmartRule] = useState<SmartRule>({});
  const [loading, setLoading] = useState(true);
  const [selectedCol, setSelectedCol] = useState<any>(null);
  const [smartClips, setSmartClips] = useState<any[]>([]);
  const api = (window as any).ghostclip;

  const icons = ["📁", "💼", "🏠", "💡", "🔧", "📝", "🎨", "🔗", "📊", "⭐", "💻", "💬", "🔒", "📅"];

  const load = async () => {
    const cols = await api?.getCollections?.() || [];
    setCollections(cols);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await api?.createCollection?.(newName.trim(), newIcon);
    setNewName("");
    setShowCreate(false);
    load();
  };

  const handleCreateSmart = async () => {
    if (!newName.trim()) return;
    await api?.createSmartCollection?.(newName.trim(), newIcon, smartRule);
    setNewName("");
    setSmartRule({});
    setShowSmart(false);
    load();
  };

  const handlePreset = async (preset: typeof SMART_PRESETS[0]) => {
    await api?.createSmartCollection?.(preset.name, preset.icon, preset.rule);
    load();
  };

  const handleDelete = async (id: string) => {
    await api?.deleteCollection?.(id);
    if (selectedCol?.id === id) setSelectedCol(null);
    load();
  };

  const handleSelectCol = async (col: any) => {
    setSelectedCol(col);
    if (col.smart_rule || col.smartRule) {
      const clips = await api?.getSmartCollectionClips?.(col.id) || [];
      setSmartClips(clips);
    } else {
      setSmartClips([]);
    }
  };

  if (loading) return <div style={{ padding: "40px", color: "#5c5c75", textAlign: "center" }}>Laden...</div>;

  // Detail view for selected collection
  if (selectedCol) {
    const isSmart = !!(selectedCol.smart_rule || selectedCol.smartRule);
    const clips = isSmart ? smartClips : [];
    return (
      <div>
        <button
          onClick={() => setSelectedCol(null)}
          style={{ background: "none", border: "none", color: "#748ffc", fontSize: "12px", cursor: "pointer", marginBottom: "16px", padding: 0 }}
        >
          ← Zurueck
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <span style={{ fontSize: "32px" }}>{selectedCol.icon}</span>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#e0e0e8" }}>{selectedCol.name}</h2>
            <p style={{ fontSize: "11px", color: "#5c5c75" }}>
              {isSmart ? `Smart Collection — ${clips.length} Treffer` : `${selectedCol.clipIds?.length || 0} Clips`}
            </p>
          </div>
        </div>
        {isSmart && clips.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {clips.map((clip: any) => (
              <div key={clip.id} style={{
                padding: "12px 16px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#e0e0e8" }}>
                    {clip.summary || clip.content?.slice(0, 80)}
                  </span>
                  <span style={{ fontSize: "10px", color: "#5c5c75", flexShrink: 0, marginLeft: "12px" }}>
                    {new Date(clip.createdAt).toLocaleDateString("de-DE")}
                  </span>
                </div>
                {clip.tags?.length > 0 && (
                  <div style={{ display: "flex", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
                    {clip.tags.map((t: string) => (
                      <span key={t} style={{
                        fontSize: "9px", padding: "2px 6px", borderRadius: "4px",
                        background: "rgba(66,99,235,0.12)", color: "#91a7ff",
                      }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {isSmart && clips.length === 0 && (
          <p style={{ color: "#5c5c75", fontSize: "13px", textAlign: "center", padding: "40px" }}>
            Keine Clips passen zu dieser Regel.
          </p>
        )}
        {!isSmart && (
          <p style={{ color: "#5c5c75", fontSize: "13px", textAlign: "center", padding: "40px" }}>
            {selectedCol.clipIds?.length || 0} Clips in dieser Sammlung.
            Clips koennen per Drag & Drop oder ueber das Kontextmenue hinzugefuegt werden.
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#e0e0e8" }}>Sammlungen</h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => { setShowSmart(!showSmart); setShowCreate(false); }}
            style={{
              background: "rgba(168,85,247,0.12)",
              border: "1px solid rgba(168,85,247,0.2)",
              color: "#c084fc",
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ⚡ Smart Collection
          </button>
          <button
            onClick={() => { setShowCreate(!showCreate); setShowSmart(false); }}
            style={{
              background: "rgba(66,99,235,0.15)",
              border: "1px solid rgba(92,124,250,0.2)",
              color: "#748ffc",
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            + Neue Sammlung
          </button>
        </div>
      </div>

      {/* Smart Collection Creator */}
      {showSmart && (
        <div style={{
          padding: "16px",
          borderRadius: "12px",
          background: "rgba(168,85,247,0.05)",
          border: "1px solid rgba(168,85,247,0.15)",
          marginBottom: "16px",
        }}>
          <p style={{ fontSize: "12px", color: "#c084fc", fontWeight: 600, marginBottom: "12px" }}>
            Smart Collection — automatisch nach Regeln filtern
          </p>

          {/* Presets */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
            {SMART_PRESETS.map(p => (
              <button
                key={p.name}
                onClick={() => handlePreset(p)}
                style={{
                  padding: "5px 10px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#c4c4d4",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                {p.icon} {p.name}
              </button>
            ))}
          </div>

          <p style={{ fontSize: "10px", color: "#5c5c75", marginBottom: "8px" }}>Oder eigene Regel erstellen:</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
            <input value={smartRule.tag || ""} onChange={e => setSmartRule(r => ({ ...r, tag: e.target.value || undefined }))}
              placeholder="Tag (z.B. arbeit)" style={inputStyle} />
            <select value={smartRule.type || ""} onChange={e => setSmartRule(r => ({ ...r, type: e.target.value || undefined }))}
              style={inputStyle}>
              <option value="">Alle Typen</option>
              <option value="text">Text</option>
              <option value="url">URL</option>
              <option value="image">Bild</option>
            </select>
            <input value={smartRule.contains || ""} onChange={e => setSmartRule(r => ({ ...r, contains: e.target.value || undefined }))}
              placeholder="Enthaelt..." style={inputStyle} />
            <select value={smartRule.maxAge || ""} onChange={e => setSmartRule(r => ({ ...r, maxAge: e.target.value || undefined }))}
              style={inputStyle}>
              <option value="">Alle Zeitraeume</option>
              <option value="1 day">Heute</option>
              <option value="7 days">Diese Woche</option>
              <option value="30 days">Dieser Monat</option>
              <option value="365 days">Dieses Jahr</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
            {icons.map(icon => (
              <button key={icon} onClick={() => setNewIcon(icon)}
                style={{
                  background: newIcon === icon ? "rgba(168,85,247,0.2)" : "transparent",
                  border: `1px solid ${newIcon === icon ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.05)"}`,
                  borderRadius: "6px", padding: "4px 8px", fontSize: "16px", cursor: "pointer",
                }}>{icon}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreateSmart()}
              placeholder="Name der Smart Collection..." style={{ ...inputStyle, flex: 1 }} />
            <button onClick={handleCreateSmart} style={{
              background: "#7c3aed", border: "none", color: "white",
              padding: "8px 16px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: 600,
            }}>Erstellen</button>
          </div>
        </div>
      )}

      {/* Normal Collection Creator */}
      {showCreate && (
        <div style={{
          padding: "16px", borderRadius: "12px",
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "16px",
        }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
            {icons.map(icon => (
              <button key={icon} onClick={() => setNewIcon(icon)}
                style={{
                  background: newIcon === icon ? "rgba(66,99,235,0.2)" : "transparent",
                  border: `1px solid ${newIcon === icon ? "rgba(92,124,250,0.3)" : "rgba(255,255,255,0.05)"}`,
                  borderRadius: "8px", padding: "6px 10px", fontSize: "18px", cursor: "pointer",
                }}>{icon}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              placeholder="Sammlungsname..." style={{ ...inputStyle, flex: 1 }} />
            <button onClick={handleCreate} style={{
              background: "#4263eb", border: "none", color: "white",
              padding: "8px 16px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: 600,
            }}>Erstellen</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
        {collections.map(col => {
          const isSmart = !!(col.smart_rule || col.smartRule);
          return (
            <div key={col.id} onClick={() => handleSelectCol(col)} style={{
              padding: "20px", borderRadius: "12px", cursor: "pointer", transition: "all 0.2s",
              background: isSmart
                ? "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(168,85,247,0.03))"
                : "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
              border: isSmart
                ? "1px solid rgba(168,85,247,0.15)"
                : "1px solid rgba(255,255,255,0.05)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "28px" }}>{col.icon}</span>
                {isSmart && <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: "rgba(168,85,247,0.15)", color: "#c084fc" }}>Smart</span>}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#e0e0e8", marginBottom: "4px" }}>{col.name}</div>
              <div style={{ fontSize: "11px", color: "#5c5c75" }}>
                {isSmart ? "Automatisch" : `${col.clipIds?.length || 0} Clips`}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(col.id); }}
                style={{
                  background: "none", border: "none", color: "#ef4444", fontSize: "10px",
                  cursor: "pointer", marginTop: "8px", padding: 0, opacity: 0.6,
                }}
              >Loeschen</button>
            </div>
          );
        })}
        {collections.length === 0 && !showCreate && !showSmart && (
          <div style={{ color: "#4a4a60", fontSize: "13px", padding: "40px", textAlign: "center", gridColumn: "1 / -1" }}>
            Keine Sammlungen — erstelle eine oder nutze Smart Collections!
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(34,34,46,0.6)",
  color: "#e0e0e8",
  fontSize: "12px",
  outline: "none",
};

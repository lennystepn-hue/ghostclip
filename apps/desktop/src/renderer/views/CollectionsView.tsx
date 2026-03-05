import React, { useState, useEffect } from "react";

export function CollectionsView() {
  const [collections, setCollections] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📁");
  const [loading, setLoading] = useState(true);

  const icons = ["📁", "💼", "🏠", "💡", "🔧", "📝", "🎨", "🔗", "📊", "⭐"];

  const load = async () => {
    const api = (window as any).ghostclip;
    const cols = await api?.getCollections?.() || [];
    setCollections(cols);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const api = (window as any).ghostclip;
    await api?.createCollection?.(newName.trim(), newIcon);
    setNewName("");
    setShowCreate(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const api = (window as any).ghostclip;
    await api?.deleteCollection?.(id);
    load();
  };

  if (loading) return <div style={{ padding: "40px", color: "#5c5c75", textAlign: "center" }}>Laden...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#e0e0e8" }}>Sammlungen</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
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

      {showCreate && (
        <div style={{
          padding: "16px",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: "16px",
        }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
            {icons.map(icon => (
              <button
                key={icon}
                onClick={() => setNewIcon(icon)}
                style={{
                  background: newIcon === icon ? "rgba(66,99,235,0.2)" : "transparent",
                  border: `1px solid ${newIcon === icon ? "rgba(92,124,250,0.3)" : "rgba(255,255,255,0.05)"}`,
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
              >
                {icon}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              placeholder="Sammlungsname..."
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(34,34,46,0.6)",
                color: "#e0e0e8",
                fontSize: "13px",
                outline: "none",
              }}
            />
            <button onClick={handleCreate} style={{
              background: "#4263eb",
              border: "none",
              color: "white",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: 600,
            }}>
              Erstellen
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
        {collections.map(col => (
          <div key={col.id} style={{
            padding: "20px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            border: "1px solid rgba(255,255,255,0.05)",
            cursor: "pointer",
            transition: "all 0.2s",
          }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>{col.icon}</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#e0e0e8", marginBottom: "4px" }}>{col.name}</div>
            <div style={{ fontSize: "11px", color: "#5c5c75" }}>
              {col.clipIds?.length || 0} Clips
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(col.id); }}
              style={{
                background: "none",
                border: "none",
                color: "#ef4444",
                fontSize: "10px",
                cursor: "pointer",
                marginTop: "8px",
                padding: 0,
                opacity: 0.6,
              }}
            >
              Loeschen
            </button>
          </div>
        ))}
        {collections.length === 0 && !showCreate && (
          <div style={{ color: "#4a4a60", fontSize: "13px", padding: "40px", textAlign: "center", gridColumn: "1 / -1" }}>
            Keine Sammlungen — erstelle eine um Clips zu organisieren!
          </div>
        )}
      </div>
    </div>
  );
}

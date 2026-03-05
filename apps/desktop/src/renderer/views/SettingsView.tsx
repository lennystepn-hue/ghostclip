import React, { useState, useEffect } from "react";

interface SettingsState {
  clipboardWatcher: boolean;
  notifications: boolean;
  screenContext: boolean;
  autoExpireSensitive: boolean;
  aiModel: string;
  [key: string]: any;
}

const SHORTCUTS = [
  { keys: "Ctrl+Shift+V", action: "Quick Panel oeffnen" },
  { keys: "Ctrl+Shift+R", action: "Reply-Vorschlaege (markierten Text)" },
  { keys: "Ctrl+Shift+F", action: "Semantische Suche" },
  { keys: "Ctrl+Shift+P", action: "Letzten Clip pinnen" },
  { keys: "Ctrl+Shift+S", action: "Screen Context Toggle" },
];

export function SettingsView() {
  const [settings, setSettings] = useState<SettingsState>({
    clipboardWatcher: true,
    notifications: true,
    screenContext: false,
    autoExpireSensitive: true,
    aiModel: "claude-sonnet-4-6",
  });
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const api = (window as any).ghostclip;

  useEffect(() => {
    api?.getSettings?.().then((s: any) => {
      if (s) {
        setSettings({
          clipboardWatcher: s.clipboardWatcher !== "false",
          notifications: s.notifications !== "false",
          screenContext: s.screenContext === "true",
          autoExpireSensitive: s.autoExpireSensitive !== "false",
          aiModel: s.aiModel || "claude-sonnet-4-6",
        });
      }
      setLoading(false);
    });
  }, []);

  const toggle = async (key: string) => {
    const newVal = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newVal }));
    await api?.updateSetting?.(key, String(newVal));
  };

  const handleClearAll = async () => {
    if (clearing) return;
    if (!confirm("ACHTUNG: Alle Clips unwiderruflich loeschen?")) return;
    setClearing(true);
    await api?.clearAllClips?.();
    setClearing(false);
  };

  const handleExport = async () => {
    try {
      setExportStatus("Exportiere...");
      const clips = await api?.getClips?.() || [];
      const data = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), clips }, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ghostclip-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus(`${clips.length} Clips exportiert!`);
      setTimeout(() => setExportStatus(""), 3000);
    } catch {
      setExportStatus("Export fehlgeschlagen");
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        setExportStatus("Importiere...");
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.clips?.length) {
          setExportStatus("Keine Clips in Datei gefunden");
          return;
        }
        const imported = await api?.importClips?.(data.clips) || 0;
        setExportStatus(`${imported} von ${data.clips.length} Clips importiert!`);
        setTimeout(() => setExportStatus(""), 4000);
      } catch {
        setExportStatus("Import fehlgeschlagen — ungueltige Datei");
      }
    };
    input.click();
  };

  if (loading) return <div style={{ padding: "40px", color: "#5c5c75", textAlign: "center" }}>Laden...</div>;

  return (
    <div style={{ maxWidth: "600px" }}>
      {/* Allgemein */}
      <h2 style={sectionTitle}>Allgemein</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
        <SettingToggle label="Clipboard Watcher" description="Ueberwacht die Zwischenablage automatisch"
          checked={settings.clipboardWatcher} onChange={() => toggle("clipboardWatcher")} />
        <SettingToggle label="Benachrichtigungen" description="Desktop-Benachrichtigungen bei neuen Clips"
          checked={settings.notifications} onChange={() => toggle("notifications")} />
      </div>

      {/* Privacy */}
      <h2 style={sectionTitle}>Privacy</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
        <SettingToggle label="Screen Context" description="Bildschirmkontext fuer bessere Vorschlaege (opt-in)"
          checked={settings.screenContext} onChange={() => toggle("screenContext")} />
        <SettingToggle label="Sensible Daten automatisch loeschen"
          description="Passwoerter und Tokens nach 5 Minuten entfernen"
          checked={settings.autoExpireSensitive} onChange={() => toggle("autoExpireSensitive")} />
      </div>

      {/* AI Model */}
      <h2 style={sectionTitle}>AI</h2>
      <div style={{ ...cardStyle, marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "#e0e0e8" }}>Aktives Modell</p>
          <p style={{ fontSize: "11px", color: "#5c5c75", marginTop: "2px" }}>Enrichment: Haiku 4.5 | Chat: Sonnet 4.6</p>
        </div>
        <span style={{
          fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", color: "#91a7ff",
          background: "rgba(66,99,235,0.12)", border: "1px solid rgba(66,99,235,0.15)",
          padding: "4px 10px", borderRadius: "6px",
        }}>Claude AI</span>
      </div>

      {/* Keyboard Shortcuts */}
      <h2 style={sectionTitle}>
        <span>Tastenkombinationen</span>
        <button onClick={() => setShowShortcuts(!showShortcuts)} style={{
          background: "none", border: "none", color: "#748ffc", fontSize: "11px", cursor: "pointer", marginLeft: "8px",
        }}>{showShortcuts ? "Ausblenden" : "Anzeigen"}</button>
      </h2>
      {showShortcuts && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "28px" }}>
          {SHORTCUTS.map(s => (
            <div key={s.keys} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#c4c4d4" }}>{s.action}</span>
              <kbd style={{
                fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", color: "#e0e0e8",
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
                padding: "3px 8px", borderRadius: "4px",
              }}>{s.keys}</kbd>
            </div>
          ))}
        </div>
      )}

      {/* Export / Import */}
      <h2 style={sectionTitle}>Daten</h2>
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <button onClick={handleExport} style={{
          flex: 1, padding: "10px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
          background: "rgba(66,99,235,0.1)", border: "1px solid rgba(66,99,235,0.2)", color: "#748ffc",
        }}>Clips exportieren (JSON)</button>
        <button onClick={handleImport} style={{
          flex: 1, padding: "10px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#8888a0",
        }}>Clips importieren</button>
      </div>
      {exportStatus && (
        <p style={{ fontSize: "11px", color: "#91a7ff", marginBottom: "20px" }}>{exportStatus}</p>
      )}

      {/* Danger Zone */}
      <h2 style={{ ...sectionTitle, color: "#ef4444" }}>Danger Zone</h2>
      <div style={{
        padding: "16px", borderRadius: "12px",
        background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)",
      }}>
        <p style={{ fontSize: "12px", color: "#c4c4d4", marginBottom: "12px" }}>
          Alle gespeicherten Clips unwiderruflich loeschen. Diese Aktion kann nicht rueckgaengig gemacht werden.
        </p>
        <button onClick={handleClearAll} disabled={clearing} style={{
          background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444",
          padding: "8px 16px", borderRadius: "8px", fontSize: "12px",
          cursor: clearing ? "not-allowed" : "pointer", fontWeight: 600, opacity: clearing ? 0.5 : 1,
        }}>{clearing ? "Loesche..." : "Alle Clips loeschen"}</button>
      </div>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: "16px", fontWeight: 600, color: "#e0e0e8", marginBottom: "16px",
  display: "flex", alignItems: "center",
};

const cardStyle: React.CSSProperties = {
  padding: "12px 16px", borderRadius: "12px",
  background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
  border: "1px solid rgba(255,255,255,0.05)",
};

function SettingToggle({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: () => void;
}) {
  return (
    <div style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "#e0e0e8" }}>{label}</p>
        <p style={{ fontSize: "11px", color: "#5c5c75", marginTop: "2px" }}>{description}</p>
      </div>
      <button onClick={onChange} style={{
        width: "40px", height: "20px", borderRadius: "10px", border: "none",
        background: checked ? "#4263eb" : "rgba(255,255,255,0.1)", cursor: "pointer",
        position: "relative", transition: "background 0.2s", flexShrink: 0, marginLeft: "12px",
      }}>
        <span style={{
          position: "absolute", top: "2px", left: checked ? "22px" : "2px",
          width: "16px", height: "16px", borderRadius: "50%", background: "white", transition: "left 0.2s",
        }} />
      </button>
    </div>
  );
}

import React, { useState, useEffect } from "react";

interface SettingsState {
  clipboardWatcher: boolean;
  notifications: boolean;
  screenContext: boolean;
  autoExpireSensitive: boolean;
  aiModel: string;
  [key: string]: any;
}

export function SettingsView() {
  const [settings, setSettings] = useState<SettingsState>({
    clipboardWatcher: true,
    notifications: true,
    screenContext: false,
    autoExpireSensitive: true,
    aiModel: "gpt-4o-mini",
  });
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const api = (window as any).ghostclip;
    api?.getSettings?.().then((s: any) => {
      if (s) {
        setSettings({
          clipboardWatcher: s.clipboardWatcher !== "false",
          notifications: s.notifications !== "false",
          screenContext: s.screenContext === "true",
          autoExpireSensitive: s.autoExpireSensitive !== "false",
          aiModel: s.aiModel || "gpt-4o-mini",
        });
      }
      setLoading(false);
    });
  }, []);

  const toggle = async (key: string) => {
    const newVal = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newVal }));
    const api = (window as any).ghostclip;
    await api?.updateSetting?.(key, String(newVal));
  };

  const handleClearAll = async () => {
    if (clearing) return;
    setClearing(true);
    const api = (window as any).ghostclip;
    await api?.clearAllClips?.();
    setClearing(false);
  };

  if (loading) return <div style={{ padding: "40px", color: "#5c5c75", textAlign: "center" }}>Laden...</div>;

  return (
    <div style={{ maxWidth: "600px" }}>
      {/* Allgemein */}
      <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#e0e0e8", marginBottom: "16px" }}>Allgemein</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
        <SettingToggle
          label="Clipboard Watcher"
          description="Ueberwacht die Zwischenablage automatisch"
          checked={settings.clipboardWatcher}
          onChange={() => toggle("clipboardWatcher")}
        />
        <SettingToggle
          label="Benachrichtigungen"
          description="Desktop-Benachrichtigungen bei neuen Clips"
          checked={settings.notifications}
          onChange={() => toggle("notifications")}
        />
      </div>

      {/* Privacy */}
      <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#e0e0e8", marginBottom: "16px" }}>Privacy</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
        <SettingToggle
          label="Screen Context"
          description="Bildschirmkontext fuer bessere Vorschlaege (opt-in)"
          checked={settings.screenContext}
          onChange={() => toggle("screenContext")}
        />
        <SettingToggle
          label="Sensible Daten automatisch loeschen"
          description="Passwoerter und Tokens nach 5 Minuten entfernen"
          checked={settings.autoExpireSensitive}
          onChange={() => toggle("autoExpireSensitive")}
        />
      </div>

      {/* AI Model */}
      <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#e0e0e8", marginBottom: "16px" }}>AI Modell</h2>
      <div style={{
        padding: "12px 16px",
        borderRadius: "12px",
        background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        border: "1px solid rgba(255,255,255,0.05)",
        marginBottom: "28px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "#e0e0e8" }}>Aktives Modell</p>
          <p style={{ fontSize: "11px", color: "#5c5c75", marginTop: "2px" }}>Wird fuer Enrichment und Chat verwendet</p>
        </div>
        <span style={{
          fontSize: "12px",
          fontFamily: "'JetBrains Mono', monospace",
          color: "#91a7ff",
          background: "rgba(66,99,235,0.12)",
          border: "1px solid rgba(66,99,235,0.15)",
          padding: "4px 10px",
          borderRadius: "6px",
        }}>
          {settings.aiModel}
        </span>
      </div>

      {/* Danger Zone */}
      <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#ef4444", marginBottom: "16px" }}>Danger Zone</h2>
      <div style={{
        padding: "16px",
        borderRadius: "12px",
        background: "rgba(239,68,68,0.05)",
        border: "1px solid rgba(239,68,68,0.15)",
      }}>
        <p style={{ fontSize: "12px", color: "#c4c4d4", marginBottom: "12px" }}>
          Alle gespeicherten Clips unwiderruflich loeschen. Diese Aktion kann nicht rueckgaengig gemacht werden.
        </p>
        <button
          onClick={handleClearAll}
          disabled={clearing}
          style={{
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#ef4444",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "12px",
            cursor: clearing ? "not-allowed" : "pointer",
            fontWeight: 600,
            opacity: clearing ? 0.5 : 1,
          }}
        >
          {clearing ? "Loesche..." : "Alle Clips loeschen"}
        </button>
      </div>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      borderRadius: "12px",
      background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
      border: "1px solid rgba(255,255,255,0.05)",
    }}>
      <div>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "#e0e0e8" }}>{label}</p>
        <p style={{ fontSize: "11px", color: "#5c5c75", marginTop: "2px" }}>{description}</p>
      </div>
      <button
        onClick={onChange}
        style={{
          width: "40px",
          height: "20px",
          borderRadius: "10px",
          border: "none",
          background: checked ? "#4263eb" : "rgba(255,255,255,0.1)",
          cursor: "pointer",
          position: "relative",
          transition: "background 0.2s",
          flexShrink: 0,
          marginLeft: "12px",
        }}
      >
        <span style={{
          position: "absolute",
          top: "2px",
          left: checked ? "22px" : "2px",
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          background: "white",
          transition: "left 0.2s",
        }} />
      </button>
    </div>
  );
}

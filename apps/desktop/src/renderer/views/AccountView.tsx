import React, { useState, useEffect } from "react";

export function AccountView() {
  const [clipCount, setClipCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState(false);
  const [encStatus, setEncStatus] = useState(false);
  const api = (window as any).ghostclip;

  useEffect(() => {
    api?.getClips?.().then((clips: any[]) => setClipCount(clips?.length || 0));
    api?.syncStatus?.().then((s: boolean) => setSyncStatus(s));
    api?.encryptionStatus?.().then((s: boolean) => setEncStatus(s));
  }, []);

  const hostname = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const platform = hostname.includes("Linux") ? "Linux" : hostname.includes("Mac") ? "macOS" : "Windows";

  return (
    <div style={{ maxWidth: "600px" }}>
      {/* Profile */}
      <div style={{
        padding: "24px", borderRadius: "16px", marginBottom: "24px",
        background: "linear-gradient(135deg, rgba(66,99,235,0.08), rgba(168,85,247,0.05))",
        border: "1px solid rgba(92,124,250,0.15)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "14px",
            background: "linear-gradient(135deg, #4263eb, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px", color: "white", fontWeight: 700,
          }}>G</div>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#e0e0e8" }}>GhostClip Lokal</h2>
            <p style={{ fontSize: "12px", color: "#5c5c75", marginTop: "2px" }}>
              Desktop App — alle Daten bleiben auf diesem Geraet
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <h3 style={sectionTitle}>Uebersicht</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
        <StatCard label="Gespeicherte Clips" value={String(clipCount)} />
        <StatCard label="Plattform" value={platform} />
        <StatCard label="Sync" value={syncStatus ? "Verbunden" : "Lokal"} color={syncStatus ? "#22c55e" : "#5c5c75"} />
        <StatCard label="Verschluesselung" value={encStatus ? "Aktiv" : "Nicht konfiguriert"} color={encStatus ? "#22c55e" : "#5c5c75"} />
      </div>

      {/* Plan */}
      <h3 style={sectionTitle}>Plan</h3>
      <div style={{
        padding: "16px 20px", borderRadius: "12px", marginBottom: "24px",
        background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        border: "1px solid rgba(255,255,255,0.05)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "#e0e0e8" }}>Free — Open Source</p>
          <p style={{ fontSize: "11px", color: "#5c5c75", marginTop: "2px" }}>
            Alle Features inklusive. Keine Limits.
          </p>
        </div>
        <span style={{
          fontSize: "11px", padding: "4px 10px", borderRadius: "6px",
          background: "rgba(34,197,94,0.12)", color: "#22c55e", fontWeight: 600,
        }}>Aktiv</span>
      </div>

      {/* AI */}
      <h3 style={sectionTitle}>AI Integration</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
        <InfoRow label="Enrichment" value="Claude Haiku 4.5" />
        <InfoRow label="Chat & Replies" value="Claude Sonnet 4.6" />
        <InfoRow label="Embeddings" value="OpenAI text-embedding-3-small" />
        <InfoRow label="Auth" value="Claude OAuth (Max Plan)" />
      </div>

      {/* Version */}
      <h3 style={sectionTitle}>App Info</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <InfoRow label="Version" value="1.0.0" />
        <InfoRow label="Electron" value="33" />
        <InfoRow label="Datenbank" value="SQLite (WAL)" />
        <InfoRow label="Lizenz" value="Open Source" />
      </div>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: "14px", fontWeight: 600, color: "#8888a0", marginBottom: "12px",
  textTransform: "uppercase", letterSpacing: "0.05em",
};

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: "12px",
      background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
      border: "1px solid rgba(255,255,255,0.05)",
    }}>
      <p style={{ fontSize: "20px", fontWeight: 700, color: color || "#e0e0e8" }}>{value}</p>
      <p style={{ fontSize: "11px", color: "#5c5c75", marginTop: "2px" }}>{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: "10px 16px", borderRadius: "10px",
      background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
      border: "1px solid rgba(255,255,255,0.04)",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <span style={{ fontSize: "12px", color: "#8888a0" }}>{label}</span>
      <span style={{ fontSize: "12px", color: "#c4c4d4", fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
    </div>
  );
}

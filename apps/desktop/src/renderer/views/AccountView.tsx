import React, { useState, useEffect } from "react";

interface AuthState {
  loggedIn: boolean;
  user: { id: string; email: string; plan: string; createdAt: string } | null;
  device: { id: string; name: string; platform: string } | null;
}

interface OAuthStatus {
  hasToken: boolean;
  expired: boolean;
}

export function AccountView() {
  const [authState, setAuthState] = useState<AuthState>({ loggedIn: false, user: null, device: null });
  const [loading, setLoading] = useState(true);
  const [clipCount, setClipCount] = useState(0);
  const [syncConnected, setSyncConnected] = useState(false);
  const [oauthStatus, setOauthStatus] = useState<OAuthStatus>({ hasToken: false, expired: false });
  const api = (window as any).ghostclip;

  useEffect(() => {
    loadState();
  }, []);

  async function loadState() {
    setLoading(true);
    try {
      const [state, clips, sync, oauth] = await Promise.all([
        api?.authState?.(),
        api?.getClips?.(),
        api?.syncStatus?.(),
        api?.oauthStatus?.(),
      ]);
      setAuthState(state || { loggedIn: false, user: null, device: null });
      setClipCount(clips?.length || 0);
      setSyncConnected(sync || false);
      setOauthStatus(oauth || { hasToken: false, expired: false });
    } catch {} finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await api?.authLogout?.();
    setAuthState({ loggedIn: false, user: null, device: null });
    setSyncConnected(false);
  }

  if (loading) {
    return <div style={{ color: "#5c5c75", padding: "40px", textAlign: "center" }}>Laden...</div>;
  }

  if (!authState.loggedIn) {
    return <AuthForm onSuccess={loadState} oauthStatus={oauthStatus} onOAuthRefresh={loadState} />;
  }

  return <AccountInfo authState={authState} clipCount={clipCount} syncConnected={syncConnected} oauthStatus={oauthStatus} onLogout={handleLogout} onOAuthRefresh={loadState} />;
}

// --- Auth Form (Login / Register) ---

function AuthForm({ onSuccess, oauthStatus, onOAuthRefresh }: { onSuccess: () => void; oauthStatus: OAuthStatus; onOAuthRefresh: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [server, setServer] = useState("");
  const [showServer, setShowServer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [oauthMsg, setOauthMsg] = useState<string | null>(null);
  const api = (window as any).ghostclip;

  async function handleOAuth() {
    setOauthBusy(true);
    setOauthMsg(null);
    try {
      const result = await api?.oauthConnect?.();
      if (result?.success) {
        setOauthMsg("Verbunden! AI ist jetzt aktiv.");
        onOAuthRefresh();
      } else {
        setOauthMsg(result?.error || "Verbindung fehlgeschlagen");
      }
    } catch (err: any) {
      setOauthMsg(err?.message || "Fehler");
    } finally {
      setOauthBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "register" && password !== confirmPassword) {
      setError("Passwoerter stimmen nicht ueberein");
      return;
    }
    if (password.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen haben");
      return;
    }

    setBusy(true);
    try {
      const serverUrl = server.trim() || undefined;
      if (mode === "register") {
        await api?.authRegister?.(email, password, serverUrl);
      } else {
        await api?.authLogin?.(email, password, serverUrl);
      }
      onSuccess();
    } catch (err: any) {
      const msg = err?.message || "Unbekannter Fehler";
      if (msg.includes("EMAIL_EXISTS") || msg.includes("already registered")) {
        setError("Diese E-Mail ist bereits registriert");
      } else if (msg.includes("INVALID_CREDENTIALS") || msg.includes("Invalid credentials")) {
        setError("E-Mail oder Passwort falsch");
      } else if (msg.includes("fetch") || msg.includes("ECONNREFUSED")) {
        setError("Server nicht erreichbar — pruefe die Server-URL");
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: "420px", margin: "0 auto" }}>
      {/* Logo / Header */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{
          width: "72px", height: "72px", borderRadius: "18px", margin: "0 auto 16px",
          background: "linear-gradient(135deg, #4263eb, #7c3aed)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "32px", color: "white", fontWeight: 700,
          boxShadow: "0 8px 32px rgba(66,99,235,0.3)",
        }}>G</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#e0e0e8" }}>
          {mode === "login" ? "Willkommen zurueck" : "Account erstellen"}
        </h2>
        <p style={{ fontSize: "13px", color: "#5c5c75", marginTop: "6px" }}>
          {mode === "login"
            ? "Melde dich an um deine Clips zu synchronisieren"
            : "Erstelle einen Account fuer Cloud Sync & Multi-Device"}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <InputField
            label="E-Mail"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="name@example.com"
            required
            autoFocus
          />
          <InputField
            label="Passwort"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={mode === "register" ? "Mind. 8 Zeichen" : "Dein Passwort"}
            required
          />
          {mode === "register" && (
            <InputField
              label="Passwort bestaetigen"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Passwort wiederholen"
              required
            />
          )}

          {/* Custom server toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowServer(!showServer)}
              style={{
                background: "none", border: "none", color: "#5c5c75",
                fontSize: "11px", cursor: "pointer", padding: "4px 0",
                textDecoration: "underline", textUnderlineOffset: "3px",
              }}
            >
              {showServer ? "Standard-Server verwenden" : "Eigenen Server verwenden"}
            </button>
            {showServer && (
              <InputField
                label="Server URL"
                type="url"
                value={server}
                onChange={setServer}
                placeholder="https://api.ghostclip.app"
              />
            )}
          </div>

          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: "10px",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444", fontSize: "12px",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              padding: "12px 20px", borderRadius: "12px", border: "none",
              background: busy ? "#3a3a52" : "linear-gradient(135deg, #4263eb, #7c3aed)",
              color: "white", fontSize: "14px", fontWeight: 600,
              cursor: busy ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: busy ? "none" : "0 4px 16px rgba(66,99,235,0.3)",
              marginTop: "4px",
            }}
          >
            {busy
              ? "Bitte warten..."
              : mode === "login"
                ? "Anmelden"
                : "Account erstellen"}
          </button>
        </div>
      </form>

      {/* Toggle mode */}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <span style={{ fontSize: "12px", color: "#5c5c75" }}>
          {mode === "login" ? "Noch keinen Account? " : "Schon registriert? "}
        </span>
        <button
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
          style={{
            background: "none", border: "none", color: "#4263eb",
            fontSize: "12px", cursor: "pointer", fontWeight: 600,
            textDecoration: "underline", textUnderlineOffset: "3px",
          }}
        >
          {mode === "login" ? "Registrieren" : "Anmelden"}
        </button>
      </div>

      {/* Claude AI OAuth */}
      <div style={{
        textAlign: "center", marginTop: "24px", padding: "18px",
        borderRadius: "12px",
        background: oauthStatus.hasToken && !oauthStatus.expired
          ? "rgba(34,197,94,0.06)"
          : "rgba(66,99,235,0.06)",
        border: `1px solid ${oauthStatus.hasToken && !oauthStatus.expired
          ? "rgba(34,197,94,0.15)"
          : "rgba(66,99,235,0.15)"}`,
      }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#e0e0e8", marginBottom: "6px" }}>
          Claude AI (lokal)
        </p>
        <p style={{ fontSize: "11px", color: "#5c5c75", marginBottom: "12px" }}>
          {oauthStatus.hasToken && !oauthStatus.expired
            ? "AI ist aktiv — Tags, Summaries und Chat funktionieren."
            : oauthStatus.expired
              ? "OAuth Token abgelaufen — klicke um neu zu verbinden."
              : "Verbinde mit deinem Claude Account fuer AI-Features ohne Server."}
        </p>
        {oauthMsg && (
          <p style={{
            fontSize: "11px", marginBottom: "8px",
            color: oauthMsg.includes("aktiv") || oauthMsg.includes("Verbunden") ? "#22c55e" : "#ef4444",
          }}>
            {oauthMsg}
          </p>
        )}
        <button
          onClick={handleOAuth}
          disabled={oauthBusy || (oauthStatus.hasToken && !oauthStatus.expired)}
          style={{
            padding: "8px 20px", borderRadius: "8px", border: "none",
            background: oauthStatus.hasToken && !oauthStatus.expired
              ? "#2a2a3e"
              : oauthBusy ? "#3a3a52" : "#4263eb",
            color: oauthStatus.hasToken && !oauthStatus.expired ? "#5c5c75" : "white",
            fontSize: "12px", fontWeight: 600,
            cursor: oauthBusy || (oauthStatus.hasToken && !oauthStatus.expired) ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {oauthBusy
            ? "Browser oeffnet..."
            : oauthStatus.hasToken && !oauthStatus.expired
              ? "Verbunden"
              : oauthStatus.expired
                ? "Neu verbinden"
                : "Mit Claude verbinden"}
        </button>
      </div>

      {/* Local mode hint */}
      <div style={{
        textAlign: "center", marginTop: "12px", padding: "14px",
        borderRadius: "10px", background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}>
        <p style={{ fontSize: "11px", color: "#5c5c75" }}>
          GhostClip funktioniert auch komplett ohne Account.
          <br />
          Cloud Sync ist optional — alle Daten bleiben lokal verschluesselt.
        </p>
      </div>
    </div>
  );
}

// --- Account Info (logged in) ---

function AccountInfo({
  authState,
  clipCount,
  syncConnected,
  oauthStatus,
  onLogout,
  onOAuthRefresh,
}: {
  authState: AuthState;
  clipCount: number;
  syncConnected: boolean;
  oauthStatus: OAuthStatus;
  onLogout: () => void;
  onOAuthRefresh: () => void;
}) {
  const hostname = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const platform = hostname.includes("Linux") ? "Linux" : hostname.includes("Mac") ? "macOS" : "Windows";
  const memberSince = authState.user?.createdAt
    ? new Date(authState.user.createdAt).toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })
    : "—";

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
          }}>
            {authState.user?.email?.[0]?.toUpperCase() || "G"}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#e0e0e8" }}>
              {authState.user?.email}
            </h2>
            <p style={{ fontSize: "12px", color: "#5c5c75", marginTop: "2px" }}>
              Mitglied seit {memberSince}
            </p>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "4px 10px", borderRadius: "8px",
            background: syncConnected ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)",
          }}>
            <div style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: syncConnected ? "#22c55e" : "#ef4444",
            }} />
            <span style={{
              fontSize: "11px", fontWeight: 600,
              color: syncConnected ? "#22c55e" : "#ef4444",
            }}>
              {syncConnected ? "Sync aktiv" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <h3 style={sectionTitle}>Uebersicht</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
        <StatCard label="Gespeicherte Clips" value={String(clipCount)} />
        <StatCard label="Plattform" value={platform} />
        <StatCard label="Cloud Sync" value={syncConnected ? "Verbunden" : "Getrennt"} color={syncConnected ? "#22c55e" : "#ef4444"} />
        <StatCard label="Plan" value={authState.user?.plan === "free" ? "Free" : authState.user?.plan || "Free"} color="#4263eb" />
      </div>

      {/* Device */}
      {authState.device && (
        <>
          <h3 style={sectionTitle}>Dieses Geraet</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
            <InfoRow label="Geraet" value={authState.device.name} />
            <InfoRow label="Plattform" value={authState.device.platform} />
            <InfoRow label="ID" value={authState.device.id.slice(0, 8) + "..."} />
          </div>
        </>
      )}

      {/* AI */}
      <h3 style={sectionTitle}>AI Integration</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
        <InfoRow label="Enrichment" value="Claude Haiku 4.5" />
        <InfoRow label="Chat & Replies" value="Claude Sonnet 4.6" />
        <InfoRow
          label="Claude OAuth"
          value={oauthStatus.hasToken && !oauthStatus.expired ? "Verbunden" : oauthStatus.expired ? "Abgelaufen" : "Nicht verbunden"}
        />
      </div>
      <OAuthButton oauthStatus={oauthStatus} onRefresh={onOAuthRefresh} />

      {/* Logout */}
      <button
        onClick={onLogout}
        style={{
          padding: "12px 24px", borderRadius: "12px", border: "1px solid rgba(239,68,68,0.2)",
          background: "rgba(239,68,68,0.08)", color: "#ef4444",
          fontSize: "13px", fontWeight: 600, cursor: "pointer",
          transition: "all 0.2s", width: "100%",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(239,68,68,0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(239,68,68,0.08)";
        }}
      >
        Abmelden
      </button>
    </div>
  );
}

// --- Shared Components ---

function InputField({
  label, type, value, onChange, placeholder, required, autoFocus,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "12px", color: "#8888a0", marginBottom: "6px", fontWeight: 500 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: "10px",
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
          color: "#e0e0e8", fontSize: "13px", outline: "none",
          transition: "border-color 0.2s",
          boxSizing: "border-box",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(66,99,235,0.5)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
      />
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

function OAuthButton({ oauthStatus, onRefresh }: { oauthStatus: OAuthStatus; onRefresh: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const api = (window as any).ghostclip;
  const connected = oauthStatus.hasToken && !oauthStatus.expired;

  async function handleClick() {
    setBusy(true);
    setMsg(null);
    try {
      const result = await api?.oauthConnect?.();
      if (result?.success) {
        setMsg("Verbunden!");
        onRefresh();
      } else {
        setMsg(result?.error || "Fehlgeschlagen");
      }
    } catch (err: any) {
      setMsg(err?.message || "Fehler");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginBottom: "24px" }}>
      {msg && (
        <p style={{
          fontSize: "11px", marginBottom: "8px", textAlign: "center",
          color: msg === "Verbunden!" ? "#22c55e" : "#ef4444",
        }}>
          {msg}
        </p>
      )}
      <button
        onClick={handleClick}
        disabled={busy || connected}
        style={{
          padding: "10px 20px", borderRadius: "10px", border: "none",
          background: connected ? "rgba(34,197,94,0.1)" : busy ? "#3a3a52" : "#4263eb",
          color: connected ? "#22c55e" : "white",
          fontSize: "12px", fontWeight: 600, width: "100%",
          cursor: busy || connected ? "not-allowed" : "pointer",
          transition: "all 0.2s",
        }}
      >
        {busy
          ? "Browser oeffnet..."
          : connected
            ? "Claude AI verbunden"
            : oauthStatus.expired
              ? "Claude AI neu verbinden"
              : "Mit Claude AI verbinden"}
      </button>
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

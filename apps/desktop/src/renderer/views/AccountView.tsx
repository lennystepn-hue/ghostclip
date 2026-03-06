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

  const oauthConnected = oauthStatus.hasToken && !oauthStatus.expired;
  const hostname = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const platform = hostname.includes("Linux") ? "Linux" : hostname.includes("Mac") ? "macOS" : "Windows";

  return (
    <div style={{ maxWidth: "520px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{
          width: "72px", height: "72px", borderRadius: "18px", margin: "0 auto 16px",
          background: "linear-gradient(135deg, #4263eb, #7c3aed)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "32px", color: "white", fontWeight: 700,
          boxShadow: "0 8px 32px rgba(66,99,235,0.3)",
        }}>G</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#e0e0e8" }}>GhostClip</h2>
        <p style={{ fontSize: "13px", color: "#5c5c75", marginTop: "4px" }}>
          Dein AI-Clipboard-Manager
        </p>
      </div>

      {/* === SECTION 1: Claude AI (Primary) === */}
      <OAuthSection oauthStatus={oauthStatus} onRefresh={loadState} />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
        <StatCard label="Gespeicherte Clips" value={String(clipCount)} />
        <StatCard label="Plattform" value={platform} />
        <StatCard label="AI Status" value={oauthConnected ? "Aktiv" : "Inaktiv"} color={oauthConnected ? "#22c55e" : "#5c5c75"} />
        <StatCard label="Cloud Sync" value={authState.loggedIn ? (syncConnected ? "Verbunden" : "Getrennt") : "—"} color={syncConnected ? "#22c55e" : "#5c5c75"} />
      </div>

      {/* === SECTION 2: Updates === */}
      <UpdateSection />

      {/* === SECTION 3: Cloud Sync (Optional) === */}
      <SyncSection
        authState={authState}
        syncConnected={syncConnected}
        onLoginSuccess={loadState}
        onLogout={handleLogout}
      />
    </div>
  );
}

// === Claude AI OAuth Section (Primary) ===

function OAuthSection({ oauthStatus, onRefresh }: { oauthStatus: OAuthStatus; onRefresh: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const api = (window as any).ghostclip;
  const connected = oauthStatus.hasToken && !oauthStatus.expired;

  async function handleConnect() {
    setBusy(true);
    setMsg(null);
    try {
      const result = await api?.oauthConnect?.();
      if (result?.success) {
        setMsg("Verbunden! AI ist jetzt aktiv.");
        onRefresh();
      } else {
        setMsg(result?.error || "Verbindung fehlgeschlagen");
      }
    } catch (err: any) {
      setMsg(err?.message || "Fehler");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      padding: "24px", borderRadius: "16px", marginBottom: "20px",
      background: connected
        ? "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))"
        : "linear-gradient(135deg, rgba(66,99,235,0.1), rgba(124,58,237,0.06))",
      border: `1px solid ${connected ? "rgba(34,197,94,0.2)" : "rgba(66,99,235,0.2)"}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <div style={{
          width: "10px", height: "10px", borderRadius: "50%",
          background: connected ? "#22c55e" : oauthStatus.expired ? "#f59e0b" : "#5c5c75",
          boxShadow: connected ? "0 0 8px rgba(34,197,94,0.5)" : "none",
        }} />
        <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#e0e0e8", margin: 0 }}>
          Claude AI
        </h3>
        {connected && (
          <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: 600, marginLeft: "auto" }}>
            Verbunden
          </span>
        )}
      </div>

      <p style={{ fontSize: "12px", color: "#8888a0", marginBottom: "16px", lineHeight: "1.5" }}>
        {connected
          ? "AI ist aktiv. Tags, Summaries, Chat und Reply-Vorschlaege funktionieren."
          : oauthStatus.expired
            ? "Dein Token ist abgelaufen. Klicke um dich neu zu verbinden."
            : "Verbinde deinen Claude Account um AI-Features zu aktivieren. Dein eigener Token — keine API Keys noetig."}
      </p>

      {connected && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
          <MiniRow label="Enrichment (Tags, Summary)" value="Claude Haiku 4.5" />
          <MiniRow label="Chat, Replies, Vision" value="Claude Sonnet 4.6" />
        </div>
      )}

      {msg && (
        <p style={{
          fontSize: "11px", marginBottom: "10px", textAlign: "center",
          color: msg.includes("aktiv") || msg.includes("Verbunden") ? "#22c55e" : "#ef4444",
        }}>
          {msg}
        </p>
      )}

      {!connected && (
        <button
          onClick={handleConnect}
          disabled={busy}
          style={{
            padding: "12px 24px", borderRadius: "12px", border: "none",
            background: busy ? "#3a3a52" : "linear-gradient(135deg, #4263eb, #7c3aed)",
            color: "white", fontSize: "14px", fontWeight: 600, width: "100%",
            cursor: busy ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            boxShadow: busy ? "none" : "0 4px 16px rgba(66,99,235,0.3)",
          }}
        >
          {busy ? "Browser oeffnet..." : oauthStatus.expired ? "Neu verbinden" : "Mit Claude verbinden"}
        </button>
      )}

      {connected && (
        <button
          onClick={handleConnect}
          style={{
            padding: "8px 16px", borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
            color: "#5c5c75", fontSize: "11px", cursor: "pointer",
            transition: "all 0.2s", width: "100%",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#8888a0"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#5c5c75"; }}
        >
          Token erneuern
        </button>
      )}
    </div>
  );
}

// === Cloud Sync Section (Optional) ===

function SyncSection({
  authState,
  syncConnected,
  onLoginSuccess,
  onLogout,
}: {
  authState: AuthState;
  syncConnected: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
}) {
  const [expanded, setExpanded] = useState(authState.loggedIn);
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [server, setServer] = useState("");
  const [showServer, setShowServer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const api = (window as any).ghostclip;

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
      onLoginSuccess();
    } catch (err: any) {
      const msg = err?.message || "Unbekannter Fehler";
      if (msg.includes("EMAIL_EXISTS") || msg.includes("already registered")) {
        setError("Diese E-Mail ist bereits registriert");
      } else if (msg.includes("INVALID_CREDENTIALS") || msg.includes("Invalid credentials")) {
        setError("E-Mail oder Passwort falsch");
      } else if (msg.includes("fetch") || msg.includes("ECONNREFUSED")) {
        setError("Server nicht erreichbar");
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  // Logged in: show sync info
  if (authState.loggedIn) {
    const memberSince = authState.user?.createdAt
      ? new Date(authState.user.createdAt).toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })
      : "—";

    return (
      <div style={{
        padding: "20px", borderRadius: "16px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{
            width: "10px", height: "10px", borderRadius: "50%",
            background: syncConnected ? "#22c55e" : "#ef4444",
            boxShadow: syncConnected ? "0 0 8px rgba(34,197,94,0.5)" : "none",
          }} />
          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#e0e0e8", margin: 0 }}>
            Cloud Sync
          </h3>
          <span style={{
            fontSize: "11px", fontWeight: 600, marginLeft: "auto",
            color: syncConnected ? "#22c55e" : "#ef4444",
          }}>
            {syncConnected ? "Verbunden" : "Getrennt"}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
          <MiniRow label="Account" value={authState.user?.email || "—"} />
          <MiniRow label="Mitglied seit" value={memberSince} />
          {authState.device && (
            <MiniRow label="Geraet" value={`${authState.device.name} (${authState.device.platform})`} />
          )}
        </div>

        <button
          onClick={onLogout}
          style={{
            padding: "8px 16px", borderRadius: "8px",
            border: "1px solid rgba(239,68,68,0.15)", background: "transparent",
            color: "#ef4444", fontSize: "11px", cursor: "pointer",
            transition: "all 0.2s", width: "100%",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          Sync abmelden
        </button>
      </div>
    );
  }

  // Not logged in: collapsible sync section
  return (
    <div style={{
      borderRadius: "16px",
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.05)",
      overflow: "hidden",
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", padding: "16px 20px",
          background: "transparent", border: "none",
          color: "#8888a0", fontSize: "13px", fontWeight: 600,
          cursor: "pointer", textAlign: "left",
          display: "flex", alignItems: "center", gap: "10px",
        }}
      >
        <span style={{
          fontSize: "10px", transition: "transform 0.2s",
          transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
          display: "inline-block",
        }}>
          &#9654;
        </span>
        Cloud Sync (optional)
        <span style={{ fontSize: "11px", fontWeight: 400, color: "#5c5c75", marginLeft: "auto" }}>
          Clips ueber mehrere Geraete synchronisieren
        </span>
      </button>

      {expanded && (
        <div style={{ padding: "0 20px 20px" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <InputField
                label="E-Mail"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="name@example.com"
                required
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

              {/* Custom server */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowServer(!showServer)}
                  style={{
                    background: "none", border: "none", color: "#5c5c75",
                    fontSize: "11px", cursor: "pointer", padding: "2px 0",
                    textDecoration: "underline", textUnderlineOffset: "3px",
                  }}
                >
                  {showServer ? "Standard-Server" : "Eigenen Server"}
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
                  padding: "8px 12px", borderRadius: "8px",
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
                  padding: "10px 20px", borderRadius: "10px", border: "none",
                  background: busy ? "#3a3a52" : "#4263eb",
                  color: "white", fontSize: "13px", fontWeight: 600,
                  cursor: busy ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {busy ? "..." : mode === "login" ? "Anmelden" : "Account erstellen"}
              </button>
            </div>
          </form>

          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <span style={{ fontSize: "11px", color: "#5c5c75" }}>
              {mode === "login" ? "Noch keinen Account? " : "Schon registriert? "}
            </span>
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
              style={{
                background: "none", border: "none", color: "#4263eb",
                fontSize: "11px", cursor: "pointer", fontWeight: 600,
              }}
            >
              {mode === "login" ? "Registrieren" : "Anmelden"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// === Update Section ===

function UpdateSection() {
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "downloading" | "ready" | "up-to-date" | "error">("idle");
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>("...");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const api = (window as any).ghostclip;

  useEffect(() => {
    api?.updateCurrentVersion?.().then((v: string) => setCurrentVersion(v || "0.1.0"));

    const cleanups = [
      api?.onUpdateAvailable?.((info: { version: string }) => {
        setNewVersion(info.version);
        setStatus("available");
      }),
      api?.onUpdateNotAvailable?.(() => {
        setStatus("up-to-date");
      }),
      api?.onUpdateProgress?.((info: { percent: number }) => {
        setProgress(info.percent);
      }),
      api?.onUpdateDownloaded?.(() => {
        setStatus("ready");
      }),
      api?.onUpdateError?.((info: { message: string }) => {
        setErrorMsg(info.message);
        setStatus("error");
      }),
    ];
    return () => cleanups.forEach((c) => c?.());
  }, []);

  async function handleCheck() {
    setStatus("checking");
    setErrorMsg(null);
    const result = await api?.updateCheck?.();
    if (result?.available) {
      setNewVersion(result.version);
      setStatus("available");
    } else if (result?.error) {
      setErrorMsg(result.error);
      setStatus("error");
    } else {
      setStatus("up-to-date");
    }
  }

  async function handleDownload() {
    setStatus("downloading");
    setProgress(0);
    await api?.updateDownload?.();
  }

  function handleInstall() {
    api?.updateInstall?.();
  }

  return (
    <div style={{
      padding: "16px 20px", borderRadius: "14px", marginBottom: "20px",
      background: status === "available" || status === "ready"
        ? "rgba(66,99,235,0.06)"
        : "rgba(255,255,255,0.02)",
      border: `1px solid ${status === "available" || status === "ready"
        ? "rgba(66,99,235,0.15)"
        : "rgba(255,255,255,0.05)"}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#e0e0e8" }}>
            GhostClip v{currentVersion}
          </span>
          {status === "available" && newVersion && (
            <span style={{ fontSize: "11px", color: "#4263eb", marginLeft: "10px", fontWeight: 600 }}>
              v{newVersion} verfuegbar!
            </span>
          )}
          {status === "up-to-date" && (
            <span style={{ fontSize: "11px", color: "#22c55e", marginLeft: "10px" }}>
              Aktuell
            </span>
          )}
          {status === "downloading" && (
            <span style={{ fontSize: "11px", color: "#f59e0b", marginLeft: "10px" }}>
              {progress}%
            </span>
          )}
          {status === "ready" && (
            <span style={{ fontSize: "11px", color: "#22c55e", marginLeft: "10px", fontWeight: 600 }}>
              Bereit zum Installieren
            </span>
          )}
        </div>

        {(status === "idle" || status === "up-to-date" || status === "error") && (
          <button
            onClick={handleCheck}
            style={{
              padding: "6px 14px", borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
              color: "#8888a0", fontSize: "11px", fontWeight: 600,
              cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(66,99,235,0.4)"; e.currentTarget.style.color = "#e0e0e8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#8888a0"; }}
          >
            Nach Updates suchen
          </button>
        )}

        {status === "checking" && (
          <span style={{ fontSize: "11px", color: "#5c5c75" }}>Pruefe...</span>
        )}

        {status === "available" && (
          <button
            onClick={handleDownload}
            style={{
              padding: "6px 14px", borderRadius: "8px", border: "none",
              background: "#4263eb", color: "white",
              fontSize: "11px", fontWeight: 600, cursor: "pointer",
            }}
          >
            Herunterladen
          </button>
        )}

        {status === "downloading" && (
          <div style={{
            width: "80px", height: "6px", borderRadius: "3px",
            background: "rgba(255,255,255,0.1)", overflow: "hidden",
          }}>
            <div style={{
              width: `${progress}%`, height: "100%", borderRadius: "3px",
              background: "#4263eb", transition: "width 0.3s",
            }} />
          </div>
        )}

        {status === "ready" && (
          <button
            onClick={handleInstall}
            style={{
              padding: "6px 14px", borderRadius: "8px", border: "none",
              background: "linear-gradient(135deg, #4263eb, #7c3aed)", color: "white",
              fontSize: "11px", fontWeight: 600, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(66,99,235,0.3)",
            }}
          >
            Jetzt installieren
          </button>
        )}
      </div>

      {errorMsg && (
        <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "8px" }}>
          {errorMsg}
        </p>
      )}
    </div>
  );
}

// === Shared Components ===

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
      <label style={{ display: "block", fontSize: "11px", color: "#8888a0", marginBottom: "4px", fontWeight: 500 }}>
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
          width: "100%", padding: "9px 12px", borderRadius: "8px",
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

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: "8px 12px", borderRadius: "8px",
      background: "rgba(255,255,255,0.03)",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <span style={{ fontSize: "11px", color: "#5c5c75" }}>{label}</span>
      <span style={{ fontSize: "11px", color: "#c4c4d4", fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
    </div>
  );
}

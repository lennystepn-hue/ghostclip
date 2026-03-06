import { shell, BrowserWindow } from "electron";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createServer } from "node:http";
import { randomBytes, createHash } from "node:crypto";

const CLAUDE_AUTH_URL = "https://console.anthropic.com/oauth/authorize";
const CLAUDE_TOKEN_URL = "https://console.anthropic.com/oauth/token";
const CLIENT_ID = "ghostclip-desktop";
const REDIRECT_PORT = 19284;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;

function getCredsPath(): string {
  const home = process.env.USERPROFILE || process.env.HOME || "/root";
  return join(home, ".claude", ".credentials.json");
}

function ensureClaudeDir(): void {
  const home = process.env.USERPROFILE || process.env.HOME || "/root";
  const dir = join(home, ".claude");
  try {
    mkdirSync(dir, { recursive: true });
  } catch {}
}

export function getOAuthToken(): string | null {
  try {
    const creds = JSON.parse(readFileSync(getCredsPath(), "utf-8"));
    const oauth = creds.claudeAiOauth;
    if (oauth?.accessToken && oauth.expiresAt > Date.now()) {
      return oauth.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

export function getOAuthStatus(): { hasToken: boolean; expired: boolean } {
  try {
    const creds = JSON.parse(readFileSync(getCredsPath(), "utf-8"));
    const oauth = creds.claudeAiOauth;
    if (!oauth?.accessToken) return { hasToken: false, expired: false };
    if (oauth.expiresAt <= Date.now()) return { hasToken: true, expired: true };
    return { hasToken: true, expired: false };
  } catch {
    return { hasToken: false, expired: false };
  }
}

function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32)
    .toString("base64url")
    .replace(/[^a-zA-Z0-9\-._~]/g, "")
    .slice(0, 128);
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

function saveOAuthTokens(data: {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}): void {
  ensureClaudeDir();
  const credsPath = getCredsPath();

  let creds: any = {};
  try {
    creds = JSON.parse(readFileSync(credsPath, "utf-8"));
  } catch {}

  creds.claudeAiOauth = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || creds.claudeAiOauth?.refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  writeFileSync(credsPath, JSON.stringify(creds, null, 2), "utf-8");
}

export async function refreshOAuthToken(): Promise<boolean> {
  try {
    const creds = JSON.parse(readFileSync(getCredsPath(), "utf-8"));
    const refreshToken = creds.claudeAiOauth?.refreshToken;
    if (!refreshToken) return false;

    const res = await fetch(CLAUDE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: CLIENT_ID,
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    saveOAuthTokens(data);
    return true;
  } catch {
    return false;
  }
}

export function startOAuthFlow(): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const { verifier, challenge } = generatePKCE();

    const params = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code_challenge: challenge,
      code_challenge_method: "S256",
      scope: "user:inference",
    });

    const authUrl = `${CLAUDE_AUTH_URL}?${params.toString()}`;

    // Start local HTTP server to receive callback
    const server = createServer(async (req, res) => {
      if (!req.url?.startsWith("/callback")) {
        res.writeHead(404);
        res.end();
        return;
      }

      const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error || !code) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`<html><body style="font-family:system-ui;text-align:center;padding:60px;background:#1a1a2e;color:#e0e0e8">
          <h2>Authentication failed</h2>
          <p style="color:#ef4444">${error || "No authorization code received"}</p>
          <p style="color:#5c5c75">You can close this tab.</p>
        </body></html>`);
        server.close();
        resolve({ success: false, error: error || "No code" });
        return;
      }

      // Exchange code for tokens
      try {
        const tokenRes = await fetch(CLAUDE_TOKEN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: CLIENT_ID,
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: verifier,
          }),
        });

        if (!tokenRes.ok) {
          const err = await tokenRes.text();
          throw new Error(`Token exchange failed: ${tokenRes.status} ${err}`);
        }

        const data = await tokenRes.json();
        saveOAuthTokens(data);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`<html><body style="font-family:system-ui;text-align:center;padding:60px;background:#1a1a2e;color:#e0e0e8">
          <h2 style="color:#22c55e">Connected!</h2>
          <p>GhostClip is now connected to Claude AI.</p>
          <p style="color:#5c5c75">You can close this tab.</p>
        </body></html>`);
        server.close();
        resolve({ success: true });
      } catch (err: any) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`<html><body style="font-family:system-ui;text-align:center;padding:60px;background:#1a1a2e;color:#e0e0e8">
          <h2>Error</h2>
          <p style="color:#ef4444">${err.message}</p>
          <p style="color:#5c5c75">You can close this tab.</p>
        </body></html>`);
        server.close();
        resolve({ success: false, error: err.message });
      }
    });

    server.listen(REDIRECT_PORT, "127.0.0.1", () => {
      shell.openExternal(authUrl);
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      resolve({ success: false, error: "Timeout — no response within 5 minutes" });
    }, 5 * 60 * 1000);
  });
}

// Auto-refresh: try to refresh token before it expires
let autoRefreshTimer: NodeJS.Timeout | null = null;

export function startAutoRefresh(): void {
  stopAutoRefresh();
  autoRefreshTimer = setInterval(async () => {
    const status = getOAuthStatus();
    if (status.hasToken && status.expired) {
      const refreshed = await refreshOAuthToken();
      if (refreshed) {
        console.log("Claude OAuth token refreshed automatically");
      }
    }
  }, 5 * 60 * 1000); // Check every 5 min
}

export function stopAutoRefresh(): void {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

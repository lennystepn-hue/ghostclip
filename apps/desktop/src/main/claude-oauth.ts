import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFile, exec } from "node:child_process";

function getCredsPath(): string {
  const home = process.env.USERPROFILE || process.env.HOME || "/root";
  return join(home, ".claude", ".credentials.json");
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

export function getOAuthStatus(): { hasToken: boolean; expired: boolean; hasCli: boolean } {
  const hasCli = isCliInstalled();
  try {
    const creds = JSON.parse(readFileSync(getCredsPath(), "utf-8"));
    const oauth = creds.claudeAiOauth;
    if (!oauth?.accessToken) return { hasToken: false, expired: false, hasCli };
    if (oauth.expiresAt <= Date.now()) return { hasToken: true, expired: true, hasCli };
    return { hasToken: true, expired: false, hasCli };
  } catch {
    return { hasToken: false, expired: false, hasCli };
  }
}

function isCliInstalled(): boolean {
  // Check common locations
  const paths = process.platform === "win32"
    ? ["claude.exe", join(process.env.LOCALAPPDATA || "", "Programs", "claude", "claude.exe")]
    : ["/usr/bin/claude", "/usr/local/bin/claude", join(process.env.HOME || "", ".npm-global", "bin", "claude")];

  for (const p of paths) {
    try {
      if (existsSync(p)) return true;
    } catch {}
  }

  // Also try which/where
  try {
    const cmd = process.platform === "win32" ? "where claude" : "which claude";
    require("child_process").execSync(cmd, { stdio: "ignore", timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

function findClaude(): string {
  // Try PATH first
  try {
    const cmd = process.platform === "win32" ? "where claude" : "which claude";
    const result = require("child_process").execSync(cmd, { encoding: "utf-8", timeout: 3000 }).trim();
    if (result) return result.split("\n")[0].trim();
  } catch {}

  // Fallback to common locations
  const paths = process.platform === "win32"
    ? [join(process.env.LOCALAPPDATA || "", "Programs", "claude", "claude.exe")]
    : ["/usr/bin/claude", "/usr/local/bin/claude"];

  for (const p of paths) {
    if (existsSync(p)) return p;
  }

  return "claude"; // hope it's in PATH
}

/**
 * Start OAuth flow via Claude CLI.
 * Runs `claude auth login` which opens the browser for Anthropic OAuth.
 * The CLI handles all the PKCE, callback, token exchange.
 * Token gets saved to ~/.claude/.credentials.json which we read.
 */
export function startOAuthFlow(): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const claudePath = findClaude();

    // Get token state before login
    const beforeToken = getOAuthToken();

    // Run claude auth login — this opens the browser
    const child = exec(`"${claudePath}" auth login`, {
      timeout: 5 * 60 * 1000, // 5 min timeout
      env: { ...process.env },
    });

    let stderr = "";
    child.stderr?.on("data", (data: string) => {
      stderr += data;
    });

    child.on("close", (code) => {
      // Check if token was updated
      const afterToken = getOAuthToken();
      if (afterToken && afterToken !== beforeToken) {
        resolve({ success: true });
      } else if (code === 0) {
        // CLI exited OK — check again after a short delay (token write might be async)
        setTimeout(() => {
          const token = getOAuthToken();
          if (token) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: "Login abgeschlossen, aber kein Token gefunden. Versuche es erneut." });
          }
        }, 1000);
      } else {
        resolve({ success: false, error: stderr.trim() || `Claude CLI exited with code ${code}` });
      }
    });

    child.on("error", (err) => {
      if ((err as any).code === "ENOENT") {
        resolve({ success: false, error: "Claude CLI nicht gefunden. Installiere es mit: npm install -g @anthropic-ai/claude-cli" });
      } else {
        resolve({ success: false, error: err.message });
      }
    });
  });
}

// Auto-refresh: Claude CLI handles refresh internally when called,
// but we can poll the credentials file to detect changes
let autoRefreshTimer: NodeJS.Timeout | null = null;

export function startAutoRefresh(): void {
  stopAutoRefresh();
  // Just poll the credentials file — if Claude CLI refreshes the token
  // (e.g. via another session), we pick it up automatically
  autoRefreshTimer = setInterval(() => {
    // getOAuthToken() already reads fresh from disk each time
    // Nothing to do here — the token is read on-demand
  }, 5 * 60 * 1000);
}

export function stopAutoRefresh(): void {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

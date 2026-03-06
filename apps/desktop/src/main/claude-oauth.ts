import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { exec, execSync } from "node:child_process";

function getCredsPath(): string {
  const home = process.env.USERPROFILE || process.env.HOME || "/root";
  return join(home, ".claude", ".credentials.json");
}

function readCredsFromKeychain(): Record<string, any> | null {
  if (process.platform !== "darwin") return null;
  try {
    const account = (process.env.USER || process.env.LOGNAME || "default").replace(/[^a-zA-Z0-9._-]/g, "");
    const raw = execSync(
      `security find-generic-password -s "Claude Code-credentials" -a "${account}" -w 2>/dev/null`,
      { encoding: "utf-8", timeout: 5000 },
    ).trim();
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readCreds(): Record<string, any> | null {
  // macOS: try Keychain first, then fall back to file
  if (process.platform === "darwin") {
    const kc = readCredsFromKeychain();
    if (kc) return kc;
  }
  // Windows / Linux / fallback: read from file
  try {
    return JSON.parse(readFileSync(getCredsPath(), "utf-8"));
  } catch {
    return null;
  }
}

export function getOAuthToken(): string | null {
  try {
    const creds = readCreds();
    if (!creds) return null;
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
    const creds = readCreds();
    if (!creds) return { hasToken: false, expired: false, hasCli };
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
 * Token gets saved to macOS Keychain (darwin) or ~/.claude/.credentials.json (Linux/Windows).
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
        resolve({ success: false, error: "Claude CLI nicht gefunden. Installiere es mit: npm install -g @anthropic-ai/claude-code" });
      } else {
        resolve({ success: false, error: err.message });
      }
    });
  });
}

// Auto-refresh is not needed — getOAuthToken() reads fresh from
// Keychain/disk on every call. Claude CLI handles token refresh internally.

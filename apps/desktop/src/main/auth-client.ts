import { getSetting, setSetting } from "./db";
import { connectSync, disconnectSync } from "./sync-client";
import { net } from "electron";

const DEFAULT_SERVER = "https://api.ghost-clip.com";

function getServerUrl(): string {
  return getSetting("syncServer", DEFAULT_SERVER);
}

async function apiRequest(path: string, options: {
  method?: string;
  body?: any;
  token?: string;
} = {}): Promise<any> {
  const url = `${getServerUrl()}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export interface AuthState {
  loggedIn: boolean;
  user: { id: string; email: string; plan: string; createdAt: string } | null;
  device: { id: string; name: string; platform: string } | null;
}

export function getAuthState(): AuthState {
  const userData = getSetting("auth_user");
  const deviceData = getSetting("auth_device");
  const accessToken = getSetting("auth_access_token");

  if (!userData || !accessToken) {
    return { loggedIn: false, user: null, device: null };
  }

  try {
    return {
      loggedIn: true,
      user: JSON.parse(userData),
      device: deviceData ? JSON.parse(deviceData) : null,
    };
  } catch {
    return { loggedIn: false, user: null, device: null };
  }
}

function getDeviceInfo() {
  const os = require("os");
  const crypto = require("crypto");

  // Use stored keypair or generate a new X25519 keypair for device encryption
  let publicKey = getSetting("device_public_key");
  if (!publicKey) {
    const { publicKey: pub, privateKey: priv } = crypto.generateKeyPairSync("x25519", {
      publicKeyEncoding: { type: "spki", format: "der" },
      privateKeyEncoding: { type: "pkcs8", format: "der" },
    });
    publicKey = pub.toString("base64");
    setSetting("device_public_key", publicKey);
    setSetting("device_private_key", priv.toString("base64"));
  }

  return {
    deviceName: os.hostname(),
    platform: process.platform,
    publicKey,
  };
}

export async function register(email: string, password: string, server?: string): Promise<AuthState> {
  if (server) {
    setSetting("syncServer", server);
  }

  const deviceInfo = getDeviceInfo();
  const crypto = require("crypto");
  const encryptedVaultKey = crypto.randomBytes(32).toString("base64");

  const result = await apiRequest("/api/auth/register", {
    method: "POST",
    body: {
      email,
      password,
      encryptedVaultKey,
      ...deviceInfo,
    },
  });

  // Store auth data locally
  setSetting("auth_user", JSON.stringify(result.user));
  setSetting("auth_device", JSON.stringify(result.device));
  setSetting("auth_access_token", result.accessToken);
  setSetting("auth_refresh_token", result.refreshToken);
  setSetting("syncToken", result.accessToken);

  // Auto-connect sync
  connectSync(result.accessToken, getServerUrl());

  return {
    loggedIn: true,
    user: result.user,
    device: result.device,
  };
}

export async function login(email: string, password: string, server?: string): Promise<AuthState> {
  if (server) {
    setSetting("syncServer", server);
  }

  const deviceInfo = getDeviceInfo();
  const existingDevice = getSetting("auth_device");
  let deviceId: string | undefined;
  if (existingDevice) {
    try {
      deviceId = JSON.parse(existingDevice).id;
    } catch {}
  }

  const result = await apiRequest("/api/auth/login", {
    method: "POST",
    body: {
      email,
      password,
      ...(deviceId ? { deviceId } : deviceInfo),
    },
  });

  // Store auth data locally
  setSetting("auth_user", JSON.stringify(result.user));
  setSetting("auth_device", JSON.stringify(result.device));
  setSetting("auth_access_token", result.accessToken);
  setSetting("auth_refresh_token", result.refreshToken);
  setSetting("syncToken", result.accessToken);

  // Auto-connect sync
  connectSync(result.accessToken, getServerUrl());

  return {
    loggedIn: true,
    user: result.user,
    device: result.device,
  };
}

export async function logout(): Promise<void> {
  const token = getSetting("auth_access_token");
  if (token) {
    try {
      await apiRequest("/api/auth/logout", {
        method: "POST",
        token,
      });
    } catch {
      // Logout locally even if server call fails
    }
  }

  disconnectSync();

  // Clear auth data
  setSetting("auth_user", "");
  setSetting("auth_device", "");
  setSetting("auth_access_token", "");
  setSetting("auth_refresh_token", "");
  setSetting("syncToken", "");
}

export async function refreshToken(): Promise<boolean> {
  const refreshTokenValue = getSetting("auth_refresh_token");
  if (!refreshTokenValue) return false;

  try {
    const result = await apiRequest("/api/auth/refresh", {
      method: "POST",
      body: { refreshToken: refreshTokenValue },
    });

    setSetting("auth_access_token", result.accessToken);
    setSetting("syncToken", result.accessToken);
    return true;
  } catch {
    // Refresh failed — user needs to re-login
    return false;
  }
}

// Auto-refresh token every 10 minutes
let refreshInterval: NodeJS.Timeout | null = null;

export function startTokenRefresh() {
  if (refreshInterval) clearInterval(refreshInterval);

  refreshInterval = setInterval(async () => {
    const state = getAuthState();
    if (state.loggedIn) {
      await refreshToken();
    }
  }, 10 * 60 * 1000); // 10 min
}

export function stopTokenRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

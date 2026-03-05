const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let accessToken: string | null = null;

export function setToken(token: string | null) {
  accessToken = token;
  if (token) localStorage.setItem("ghostclip_token", token);
  else localStorage.removeItem("ghostclip_token");
}

export function getToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    accessToken = localStorage.getItem("ghostclip_token");
  }
  return accessToken;
}

async function fetchApi(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Token expired -- try refresh
    const refreshToken = localStorage.getItem("ghostclip_refresh");
    if (refreshToken) {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.ok) {
        const { accessToken: newToken } = await refreshRes.json();
        setToken(newToken);
        headers["Authorization"] = `Bearer ${newToken}`;
        return fetch(`${API_URL}${path}`, { ...options, headers });
      }
    }
    // Refresh failed
    setToken(null);
    localStorage.removeItem("ghostclip_refresh");
    if (typeof window !== "undefined") window.location.href = "/auth/login";
    throw new Error("Unauthorized");
  }

  return res;
}

// Auth
export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Login fehlgeschlagen");
  const data = await res.json();
  setToken(data.accessToken);
  localStorage.setItem("ghostclip_refresh", data.refreshToken);
  return data;
}

export async function register(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Registrierung fehlgeschlagen");
  const data = await res.json();
  setToken(data.accessToken);
  localStorage.setItem("ghostclip_refresh", data.refreshToken);
  return data;
}

export async function logout() {
  try { await fetchApi("/auth/logout", { method: "POST" }); } catch {}
  setToken(null);
  localStorage.removeItem("ghostclip_refresh");
}

// Clips
export async function getClips(params?: Record<string, string>) {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await fetchApi(`/clips${query}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getClipStats() {
  const res = await fetchApi("/clips/stats");
  if (!res.ok) return null;
  return res.json();
}

export async function updateClip(id: string, data: Record<string, unknown>) {
  const res = await fetchApi(`/clips/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  return res.json();
}

export async function deleteClip(id: string) {
  await fetchApi(`/clips/${id}`, { method: "DELETE" });
}

// AI
export async function aiChat(message: string) {
  const res = await fetchApi("/ai/chat", { method: "POST", body: JSON.stringify({ message }) });
  if (!res.ok) throw new Error("Chat fehlgeschlagen");
  return res.json();
}

export async function aiReplies(message: string, context?: string) {
  const res = await fetchApi("/ai/replies", { method: "POST", body: JSON.stringify({ message, context }) });
  if (!res.ok) return [];
  return res.json();
}

// Collections
export async function getCollections() {
  const res = await fetchApi("/collections");
  if (!res.ok) return [];
  return res.json();
}

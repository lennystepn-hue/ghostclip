import { app, BrowserWindow, shell, ipcMain, nativeImage, clipboard } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { ClipboardWatcher } from "./clipboard-watcher";
import { createTray } from "./tray";
import { registerHotkeys, unregisterHotkeys } from "./hotkeys";
import { toggleQuickPanel } from "./quick-panel";
import { notifyClipCaptured, notify } from "./notifications";
import { enrichClip } from "@ghostclip/ai-client";
import { initEncryption, encryptContent, isEncryptionReady } from "./encryption";
import { connectSync, emitClipNew, emitClipUpdate, emitClipDelete, isSyncConnected } from "./sync-client";
import { showReplyPanel, createReplyPanel } from "./reply-panel";
import { fetchUrlContent } from "./url-fetcher";
import { createFloatingWidget, setupWidgetIPC, sendToWidget } from "./floating-widget";
import { getAuthState, register as authRegister, login as authLogin, logout as authLogout, startTokenRefresh } from "./auth-client";
import { getOAuthToken, getOAuthStatus, startOAuthFlow, startAutoRefresh } from "./claude-oauth";
import { autoUpdater } from "electron-updater";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import {
  initDb,
  insertClip,
  updateClip,
  getAllClips,
  deleteClipById,
  searchClips as dbSearchClips,
  getSetting,
  setSetting,
  getAllSettings,
  getCollections,
  createCollection,
  addClipToCollection,
  removeClipFromCollection,
  deleteCollection,
  getClipStats,
  cleanExpiredClips,
  getAllTags,
  getClipsByTag,
  clearAllClips,
  updateClipEmbedding,
  getClipsWithEmbeddings,
  getChatMessages,
  addChatMessage,
  clearChatHistory,
  createSmartCollection,
  getSmartCollectionClips,
  importClips,
  getRecentClipsSummary,
  getUserProfile,
  getUsedReplyStyles,
} from "./db";

// Note: Do NOT use --no-sandbox globally — it disables Chromium's security layer.

// Prevent crash on EPIPE/broken pipe errors
process.on("uncaughtException", (err) => {
  if ((err as any).code === "EPIPE" || err.message?.includes("EPIPE")) {
    console.log("EPIPE error caught (harmless):", err.message);
    return;
  }
  console.error("Uncaught exception:", err);
});

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

// OAuth token is now managed by claude-oauth.ts module

// Get API key from settings or environment
function getApiKey(): string | null {
  return getSetting("anthropic_api_key") || process.env.ANTHROPIC_API_KEY || null;
}

// Get the best available AI credentials
function getAiCredentials(): { oauthToken?: string; apiKey?: string } {
  const oauth = getOAuthToken();
  if (oauth) return { oauthToken: oauth };
  const key = getApiKey();
  if (key) return { apiKey: key };
  return {};
}

// Server-side AI proxy for logged-in users without local OAuth
async function serverAiRequest(endpoint: string, body: any): Promise<any> {
  const token = getSetting("auth_access_token");
  const server = getSetting("syncServer", "https://api.ghost-clip.com");
  if (!token) return null;

  const res = await fetch(`${server}/api/ai/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Server AI ${res.status}`);
  return res.json();
}

// Check if AI is available (OAuth, API key, or server account)
function hasAiAccess(oauthToken: string | null): boolean {
  if (oauthToken) return true;
  if (getApiKey()) return true;
  const authToken = getSetting("auth_access_token");
  return !!authToken;
}

function getOpenAiKey(): string | null {
  return getSetting("openai_api_key") || process.env.OPENAI_API_KEY || null;
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = getOpenAiKey();
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "text-embedding-3-small", input: text.slice(0, 8000) }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.embedding || null;
  } catch { return null; }
}

function createWindow() {
  const appIcon = nativeImage.createFromPath(
    join(__dirname, "../../resources/icon.png"),
  );

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#0f0f14",
    icon: appIcon,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  // Hide to tray instead of closing
  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.ghostclip.app");

  // Initialize SQLite database
  initDb();
  console.log("SQLite database initialized");

  // Initialize encryption (if vault key exists)
  const encryptionReady = initEncryption();
  if (encryptionReady) {
    console.log("E2E encryption initialized");
  } else {
    console.log("E2E encryption not configured (local-only mode)");
  }

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  const oauthToken = getOAuthToken();
  const apiKey = getApiKey();
  if (oauthToken) {
    console.log("Claude OAuth token loaded (Max plan)");
  } else if (apiKey) {
    console.log("Anthropic API key loaded");
  }

  // Screen context: detect active window
  let lastActiveApp = "";
  function getActiveWindow(): string {
    try {
      if (process.platform === "linux") {
        const name = execSync("xdotool getactivewindow getwindowname", {
          encoding: "utf-8",
          timeout: 2000,
          stdio: ["pipe", "pipe", "ignore"],
        }).trim();
        return name;
      }
      return "";
    } catch { return lastActiveApp; }
  }

  setInterval(() => {
    try {
      const appName = getActiveWindow();
      if (appName && appName !== lastActiveApp) {
        lastActiveApp = appName;
        mainWindow?.webContents.send("context:activeApp", appName);
      }
    } catch { /* ignore */ }
  }, 5000);

  // Clipboard watcher
  const clipboardWatcher = new ClipboardWatcher();
  clipboardWatcher.start(async (entry) => {
    // Create clip object immediately
    const clip = {
      id: crypto.randomUUID(),
      type: entry.type,
      content: entry.type === "image" ? "[Bild]" : entry.content,
      contentHash: entry.contentHash,
      summary: entry.type === "image" ? "Bild wird analysiert..." : entry.content.slice(0, 100),
      tags: [] as string[],
      mood: null as string | null,
      actions: [] as any[],
      sensitivity: null as string | null,
      sourceApp: entry.sourceApp || lastActiveApp,
      imageData: entry.type === "image" ? entry.content : null,
      pinned: false,
      archived: false,
      createdAt: new Date().toISOString(),
      enriched: false,
    };

    // Save to SQLite + notify renderer
    insertClip(clip);
    emitClipNew(clip);
    mainWindow?.webContents.send("clip:new", clip);
    sendToWidget("clip:new", clip);
    notifyClipCaptured(clip.summary, clip.type);

    // For URLs: fetch page content for richer AI analysis
    let urlMeta: { title: string; description: string; text: string } | null = null;
    if (entry.type === "url") {
      urlMeta = await fetchUrlContent(entry.content.trim());
      if (urlMeta) {
        clip.summary = urlMeta.title || clip.summary;
        // Store URL + page content for search & AI context
        const parts = [`URL: ${entry.content.trim()}`];
        if (urlMeta.title) parts.push(`Titel: ${urlMeta.title}`);
        if (urlMeta.description) parts.push(`Beschreibung: ${urlMeta.description}`);
        if (urlMeta.text) parts.push(`Seiteninhalt:\n${urlMeta.text.slice(0, 3000)}`);
        clip.content = parts.join("\n\n");
        updateClip(clip);
        mainWindow?.webContents.send("clip:updated", clip);
        console.log(`URL fetched: "${urlMeta.title}" (${urlMeta.text.length} chars)`);
      }
    }

    // AI enrichment (async — update comes later)
    // Works with local OAuth (Claude Max) OR via server (for registered users)
    if (hasAiAccess(oauthToken)) {
      try {
        let result: any;

        const creds = getAiCredentials();
        const hasLocalAi = !!(creds.oauthToken || creds.apiKey);

        if (entry.type === "image") {
          if (hasLocalAi) {
            // Local AI: direct API call
            const { analyzeImage } = await import("@ghostclip/ai-client");
            const visionResult = await analyzeImage({ imageBase64: entry.content, ...creds });
            result = {
              tags: visionResult.tags,
              summary: visionResult.summary || visionResult.description,
              mood: visionResult.mood,
              actions: visionResult.actions,
              sensitivity: visionResult.sensitivity,
            };
            if (visionResult.ocrText) {
              clip.content = `[Bild] ${visionResult.description}\n\nOCR: ${visionResult.ocrText}`;
            } else {
              clip.content = `[Bild] ${visionResult.description}`;
            }
          } else {
            // Server proxy: send image to our server
            const visionResult = await serverAiRequest("vision", { imageBase64: entry.content, mediaType: "image/png" });
            result = {
              tags: visionResult.tags,
              summary: visionResult.summary || visionResult.description,
              mood: visionResult.mood,
              actions: visionResult.actions,
              sensitivity: visionResult.sensitivity,
            };
            if (visionResult.ocrText) {
              clip.content = `[Bild] ${visionResult.description}\n\nOCR: ${visionResult.ocrText}`;
            } else {
              clip.content = `[Bild] ${visionResult.description}`;
            }
          }
          console.log(`Vision analyzed: "${result.summary}"`);
        } else {
          // Text/URL enrichment with learning context
          const enrichContent = entry.type === "url" && urlMeta
            ? `URL: ${entry.content}\nTitel: ${urlMeta.title}\nBeschreibung: ${urlMeta.description}\nSeiteninhalt: ${urlMeta.text.slice(0, 1500)}`
            : entry.content.slice(0, 2000);

          if (hasLocalAi) {
            // Local AI: direct API call
            const recentSummary = getRecentClipsSummary(5);
            const userProfile = getUserProfile();
            const learningContext = [
              recentSummary ? `Letzte Clips:\n${recentSummary}` : "",
              userProfile ? `User-Profil:\n${userProfile}` : "",
            ].filter(Boolean).join("\n\n");

            result = await enrichClip({
              type: entry.type,
              content: enrichContent,
              ...creds,
              recentClipsSummary: learningContext || undefined,
            });
          } else {
            // Server proxy: send to our server
            result = await serverAiRequest("enrich", { type: entry.type, content: enrichContent });
          }
        }

        // Update clip with AI data
        clip.tags = result.tags;
        clip.summary = result.summary || clip.summary;
        clip.mood = result.mood;
        clip.actions = result.actions;
        clip.sensitivity = result.sensitivity;
        clip.enriched = true;

        // Update in DB + notify renderer
        updateClip(clip);
        emitClipUpdate(clip);
        mainWindow?.webContents.send("clip:updated", clip);
        console.log(`AI enriched: "${clip.summary}" [${clip.tags.join(", ")}]`);

        // Generate embedding for semantic search
        const embeddingText = `${clip.summary} ${clip.tags.join(" ")} ${clip.content?.slice(0, 500)}`;
        const embedding = await generateEmbedding(embeddingText);
        if (embedding) {
          updateClipEmbedding(clip.id, embedding);
        }

        // Auto-detect messages: if mood suggests communication, generate reply suggestions
        const messageMoods = ["kommunikation", "nachricht", "frage", "anfrage", "bitte", "einladung"];
        const isMessage = messageMoods.some(m => clip.mood?.toLowerCase().includes(m))
          || clip.tags.some((t: string) => ["nachricht", "email", "chat", "message", "frage"].includes(t.toLowerCase()));

        if (isMessage) {
          try {
            let replies: any[];
            if (hasLocalAi) {
              const { generateReplies } = await import("@ghostclip/ai-client");
              const userStyle = getUsedReplyStyles();
              const recentContext = getRecentClipsSummary(3);
              replies = await generateReplies({
                message: clip.content.slice(0, 1000),
                ...creds,
                context: recentContext || undefined,
                userStyle: userStyle ? `Typische Antworten des Users (lerne seinen Stil):\n${userStyle.slice(0, 800)}` : undefined,
              });
            } else {
              replies = await serverAiRequest("replies", { message: clip.content.slice(0, 1000) });
            }
            if (replies.length > 0) {
              mainWindow?.webContents.send("reply:suggestions", { clipId: clip.id, replies });
              sendToWidget("reply:suggestions", { clipId: clip.id, replies });
              notify({
                type: "reply",
                title: "Antwortvorschlaege bereit",
                body: `${replies[0].text.slice(0, 60)}...`,
                onClick: () => {
                  createReplyPanel(clip.content.slice(0, 500));
                },
              });
              console.log(`Auto-reply suggestions for: "${clip.summary}"`);
            }
          } catch (err: any) {
            console.error("Auto-reply failed:", err.message);
          }
        }
      } catch (err: any) {
        console.error("AI enrichment failed:", err.message);
      }
    }
  });

  // System tray
  createTray(mainWindow);

  // Floating widget IPC (widget starts via tray menu, not auto)
  setupWidgetIPC();

  // Autostart
  if (!is.dev) {
    app.setLoginItemSettings({
      openAtLogin: getSetting("autostart", "true") === "true",
      args: ["--hidden"],
    });
  }

  // Global hotkeys
  registerHotkeys(mainWindow);

  // Connect to sync server if configured
  const syncToken = getSetting("syncToken");
  const syncServer = getSetting("syncServer", "https://api.ghost-clip.com");
  if (syncToken) {
    connectSync(syncToken, syncServer);
  }

  // IPC: Encryption status
  ipcMain.handle("encryption:status", () => isEncryptionReady());

  // IPC: Encrypt content (for manual encryption)
  ipcMain.handle("encryption:encrypt", (_e, text: string) => encryptContent(text));

  // IPC: Sync status
  ipcMain.handle("sync:status", () => isSyncConnected());

  // IPC: Connect sync
  ipcMain.handle("sync:connect", (_e, token: string, server?: string) => {
    setSetting("syncToken", token);
    if (server) setSetting("syncServer", server);
    connectSync(token, server || "https://api.ghost-clip.com");
    return true;
  });

  // IPC: Auth
  ipcMain.handle("auth:state", () => getAuthState());
  ipcMain.handle("auth:register", async (_e, email: string, password: string, server?: string) => {
    return authRegister(email, password, server);
  });
  ipcMain.handle("auth:login", async (_e, email: string, password: string, server?: string) => {
    return authLogin(email, password, server);
  });
  ipcMain.handle("auth:logout", async () => {
    await authLogout();
    return true;
  });

  // IPC: Claude AI (OAuth + API Key)
  ipcMain.handle("ai:status", () => {
    const oauth = getOAuthStatus();
    const claudeKey = getApiKey();
    const openaiKey = getOpenAiKey();
    return {
      oauth,
      hasApiKey: !!claudeKey,
      apiKeyPreview: claudeKey ? `${claudeKey.slice(0, 10)}...${claudeKey.slice(-4)}` : null,
      hasOpenAiKey: !!openaiKey,
      openAiKeyPreview: openaiKey ? `${openaiKey.slice(0, 10)}...${openaiKey.slice(-4)}` : null,
      active: (oauth.hasToken && !oauth.expired) || !!claudeKey,
    };
  });
  ipcMain.handle("oauth:status", () => getOAuthStatus());
  ipcMain.handle("oauth:connect", async () => {
    return startOAuthFlow();
  });
  ipcMain.handle("ai:setApiKey", (_e, key: string) => {
    setSetting("anthropic_api_key", key.trim());
    return true;
  });
  ipcMain.handle("ai:removeApiKey", () => {
    setSetting("anthropic_api_key", "");
    return true;
  });
  ipcMain.handle("ai:setOpenAiKey", (_e, key: string) => {
    setSetting("openai_api_key", key.trim());
    return true;
  });
  ipcMain.handle("ai:removeOpenAiKey", () => {
    setSetting("openai_api_key", "");
    return true;
  });

  // Start OAuth auto-refresh
  startAutoRefresh();

  // --- Auto-Updater ---
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  let updateAvailable: { version: string } | null = null;

  autoUpdater.on("update-available", (info) => {
    updateAvailable = { version: info.version };
    mainWindow?.webContents.send("update:available", { version: info.version });
  });

  autoUpdater.on("update-not-available", () => {
    mainWindow?.webContents.send("update:not-available");
  });

  autoUpdater.on("download-progress", (progress) => {
    mainWindow?.webContents.send("update:progress", { percent: Math.round(progress.percent) });
  });

  autoUpdater.on("update-downloaded", () => {
    mainWindow?.webContents.send("update:downloaded");
  });

  autoUpdater.on("error", (err) => {
    mainWindow?.webContents.send("update:error", { message: err.message });
  });

  ipcMain.handle("update:check", async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return result?.updateInfo ? { available: true, version: result.updateInfo.version } : { available: false };
    } catch (err: any) {
      return { available: false, error: err.message };
    }
  });

  ipcMain.handle("update:download", async () => {
    await autoUpdater.downloadUpdate();
    return true;
  });

  ipcMain.handle("update:install", () => {
    autoUpdater.quitAndInstall(false, true);
  });

  ipcMain.handle("update:currentVersion", () => {
    return app.getVersion();
  });

  // Check for updates 10s after launch, then every 6h
  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 10_000);
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 6 * 60 * 60 * 1000);

  // Auto-refresh tokens if logged in
  const authState = getAuthState();
  if (authState.loggedIn) {
    startTokenRefresh();
    // Auto-connect sync on startup
    const token = getSetting("auth_access_token");
    const server = getSetting("syncServer", "https://api.ghost-clip.com");
    if (token) connectSync(token, server);
  }

  // IPC: Get all clips (from SQLite)
  ipcMain.handle("clips:list", () => getAllClips());

  // IPC: Delete clip
  ipcMain.handle("clips:delete", (_e, id: string) => {
    deleteClipById(id);
    emitClipDelete(id);
    return true;
  });

  // IPC: Pin clip
  ipcMain.handle("clips:pin", (_e, id: string) => {
    const clips = getAllClips();
    const clip = clips.find((c: any) => c.id === id);
    if (clip) {
      clip.pinned = !clip.pinned;
      updateClip(clip);
      mainWindow?.webContents.send("clip:updated", clip);
    }
    return true;
  });

  // IPC: Archive clip
  ipcMain.handle("clips:archive", (_e, id: string) => {
    const clips = getAllClips();
    const clip = clips.find((c: any) => c.id === id);
    if (clip) {
      clip.archived = true;
      updateClip(clip);
      mainWindow?.webContents.send("clip:updated", clip);
    }
    return true;
  });

  // IPC: Search clips (SQLite LIKE)
  ipcMain.handle("clips:search", (_e, query: string) => {
    return dbSearchClips(query);
  });

  // IPC: Semantic search
  ipcMain.handle("clips:semanticSearch", async (_e, query: string) => {
    const queryEmbedding = await generateEmbedding(query);
    if (!queryEmbedding) return dbSearchClips(query); // fallback to text search

    const clipsWithEmbeddings = getClipsWithEmbeddings();
    if (clipsWithEmbeddings.length === 0) return dbSearchClips(query);

    // Compute cosine similarity
    const scored = clipsWithEmbeddings.map(clip => {
      const dotProduct = clip.embedding.reduce((sum, val, i) => sum + val * queryEmbedding[i], 0);
      const normA = Math.sqrt(clip.embedding.reduce((sum, val) => sum + val * val, 0));
      const normB = Math.sqrt(queryEmbedding.reduce((sum, val) => sum + val * val, 0));
      const similarity = dotProduct / (normA * normB);
      return { id: clip.id, similarity };
    });

    const topIds = scored.sort((a, b) => b.similarity - a.similarity).slice(0, 20).filter(s => s.similarity > 0.3).map(s => s.id);

    if (topIds.length === 0) return dbSearchClips(query);

    const allClips = getAllClips();
    return topIds.map(id => allClips.find(c => c.id === id)).filter(Boolean);
  });

  // Window control IPC handlers
  ipcMain.on("window:minimize", () => mainWindow?.minimize());
  ipcMain.on("window:maximize", () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.on("window:close", () => mainWindow?.hide());
  ipcMain.on("quickpanel:toggle", () => toggleQuickPanel());

  // IPC: Reply suggestions (local OAuth/API key or server proxy)
  ipcMain.handle("ai:replies", async (_e, message: string, context?: string) => {
    const creds = getAiCredentials();
    try {
      if (creds.oauthToken || creds.apiKey) {
        const { generateReplies } = await import("@ghostclip/ai-client");
        return await generateReplies({ message, context, ...creds });
      }
      return await serverAiRequest("replies", { message }) || [];
    } catch (err: any) {
      console.error("Reply generation failed:", err.message);
      return [];
    }
  });

  // IPC: AI Chat — full DB access: recent clips + keyword search across entire history
  ipcMain.handle("ai:chat", async (_e, message: string) => {
    const creds = getAiCredentials();
    const hasLocal = !!(creds.oauthToken || creds.apiKey);
    if (!hasLocal && !getSetting("auth_access_token")) return "Bitte Claude verbinden oder API Key eingeben fuer AI-Features.";
    try {
      const { chat } = await import("@ghostclip/ai-client");

      // 1. Always include recent 20 clips as immediate context
      const recentClips = getAllClips(20);

      // 2. Extract search keywords from user message and search entire DB
      const keywords = message
        .replace(/[?!.,;:()]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 2)
        .slice(0, 5);

      const searchResults: any[] = [];
      const seenIds = new Set(recentClips.map(c => c.id));
      for (const keyword of keywords) {
        const results = dbSearchClips(keyword);
        for (const clip of results) {
          if (!seenIds.has(clip.id)) {
            seenIds.add(clip.id);
            searchResults.push(clip);
          }
        }
      }

      // Format clip for context
      const formatClip = (c: any) => {
        const parts = [`[${c.type}] ${c.createdAt}`];
        if (c.summary) parts.push(`Summary: ${c.summary}`);
        if (c.tags?.length) parts.push(`Tags: ${c.tags.join(", ")}`);
        if (c.mood) parts.push(`Mood: ${c.mood}`);
        if (c.content) parts.push(`Content: ${c.content.slice(0, 800)}`);
        return parts.join(" | ");
      };

      let clipContext = "=== LETZTE 20 CLIPS ===\n" + recentClips.map(formatClip).join("\n---\n");

      if (searchResults.length > 0) {
        clipContext += `\n\n=== SUCHERGEBNISSE AUS GESAMTER DB (${searchResults.length} Treffer) ===\n`
          + searchResults.slice(0, 30).map(formatClip).join("\n---\n");
      }

      // Include conversation history for context
      const history = getChatMessages(20);
      const conversationHistory = history.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.text,
      }));

      let response: string;
      if (hasLocal) {
        response = await chat({ message, ...creds, clipContext, conversationHistory });
      } else {
        // Server proxy for registered users
        const serverResult = await serverAiRequest("chat", { message, conversationHistory });
        response = serverResult?.response || "Server-Fehler";
      }

      // Persist both messages
      addChatMessage("user", message);
      addChatMessage("assistant", response);

      return response;
    } catch (err: any) {
      console.error("AI Chat failed:", err.message);
      // Still save user message so history is consistent
      addChatMessage("user", message);
      const errMsg = "Fehler: " + err.message;
      addChatMessage("assistant", errMsg);
      return errMsg;
    }
  });

  // IPC: Chat history
  ipcMain.handle("chat:history", () => getChatMessages(200));
  ipcMain.handle("chat:clear", () => { clearChatHistory(); return true; });

  // IPC: Device info (local device)
  ipcMain.handle("devices:list", () => {
    const hostname = require("os").hostname();
    const platform = process.platform === "linux" ? "linux" : process.platform === "darwin" ? "mac" : "windows";
    const clipCount = (getAllClips(99999)).length;
    return [{
      id: "local",
      name: hostname,
      platform,
      isOnline: true,
      lastSync: new Date().toISOString(),
      clipCount,
      isCurrent: true,
    }];
  });

  // IPC: Vision/OCR (local OAuth/API key or server proxy)
  ipcMain.handle("ai:vision", async (_e, base64Image: string) => {
    const creds = getAiCredentials();
    try {
      if (creds.oauthToken || creds.apiKey) {
        const { analyzeImage } = await import("@ghostclip/ai-client");
        return await analyzeImage({ imageBase64: base64Image, ...creds });
      }
      return await serverAiRequest("vision", { imageBase64: base64Image, mediaType: "image/png" });
    } catch (err: any) {
      console.error("Vision failed:", err.message);
      return null;
    }
  });

  // IPC: Analytics
  ipcMain.handle("analytics:stats", () => getClipStats());

  // IPC: Tags
  ipcMain.handle("tags:list", () => getAllTags());
  ipcMain.handle("tags:clips", (_e, tag: string) => getClipsByTag(tag));

  // IPC: Collections
  ipcMain.handle("collections:list", () => getCollections());
  ipcMain.handle("collections:create", (_e, name: string, icon: string) => {
    const id = crypto.randomUUID();
    createCollection(id, name, icon);
    return { id, name, icon, clipIds: [], createdAt: new Date().toISOString() };
  });
  ipcMain.handle("collections:delete", (_e, id: string) => { deleteCollection(id); return true; });
  ipcMain.handle("collections:addClip", (_e, collectionId: string, clipId: string) => { addClipToCollection(collectionId, clipId); return true; });
  ipcMain.handle("collections:removeClip", (_e, collectionId: string, clipId: string) => { removeClipFromCollection(collectionId, clipId); return true; });
  ipcMain.handle("collections:createSmart", (_e, name: string, icon: string, rule: object) => {
    const id = crypto.randomUUID();
    createSmartCollection(id, name, icon, rule);
    return { id, name, icon, smartRule: rule, clipIds: [], createdAt: new Date().toISOString() };
  });
  ipcMain.handle("collections:smartClips", (_e, collectionId: string) => getSmartCollectionClips(collectionId));

  // IPC: Settings
  ipcMain.handle("settings:get", () => getAllSettings());
  ipcMain.handle("settings:update", (_e, key: string, value: string) => { setSetting(key, value); return true; });

  // IPC: Open URL in default browser
  ipcMain.handle("shell:openUrl", (_e, url: string) => {
    shell.openExternal(url);
    return true;
  });

  // IPC: Fetch URL content (for manual re-fetch)
  ipcMain.handle("url:fetch", async (_e, url: string) => {
    return await fetchUrlContent(url);
  });

  // IPC: Clipboard write (paste from history)
  ipcMain.handle("clipboard:write", (_e, text: string) => {
    clipboard.writeText(text);
    return true;
  });

  // IPC: Clear all clips (panic button)
  ipcMain.handle("clips:clearAll", () => { clearAllClips(); return true; });

  // IPC: Import clips from JSON
  ipcMain.handle("clips:import", (_e, clips: any[]) => {
    const imported = importClips(clips);
    return imported;
  });

  // Auto-expire sensitive clips every 60 seconds
  setInterval(() => {
    const deleted = cleanExpiredClips();
    if (deleted > 0) {
      console.log(`Auto-expired ${deleted} sensitive clips`);
      mainWindow?.webContents.send("clips:expired", deleted);
    }
  }, 60_000);

  app.on("activate", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });

  // Mark as quitting so close handler lets window actually close
  app.on("before-quit", () => {
    isQuitting = true;
  });

  app.on("will-quit", () => {
    clipboardWatcher.stop();
    unregisterHotkeys();
  });
});

// Don't quit on all windows closed — keep running in tray
app.on("window-all-closed", () => {
  // Do nothing — app stays alive in system tray
});

export { mainWindow };

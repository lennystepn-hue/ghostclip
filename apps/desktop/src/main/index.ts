import { app, BrowserWindow, shell, ipcMain, nativeImage } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { ClipboardWatcher } from "./clipboard-watcher";
import { createTray } from "./tray";
import { registerHotkeys, unregisterHotkeys } from "./hotkeys";
import { notifyClipCaptured } from "./notifications";
import { enrichClip } from "@ghostclip/ai-client";
import { readFileSync } from "node:fs";
import {
  initDb,
  insertClip,
  updateClip,
  getAllClips,
  deleteClipById,
  searchClips as dbSearchClips,
} from "./db";

// Allow running as root (dev/container environments)
app.commandLine.appendSwitch("no-sandbox");

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

// Load OAuth token from Claude CLI credentials
function getOAuthToken(): string | null {
  try {
    const credsPath = join(
      process.env.HOME || "/root",
      ".claude",
      ".credentials.json",
    );
    const creds = JSON.parse(readFileSync(credsPath, "utf-8"));
    const oauth = creds.claudeAiOauth;
    if (oauth?.accessToken && oauth.expiresAt > Date.now()) {
      return oauth.accessToken;
    }
    console.log("OAuth token expired or missing, AI enrichment disabled");
    return null;
  } catch {
    console.log("No Claude CLI credentials found, AI enrichment disabled");
    return null;
  }
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

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  const oauthToken = getOAuthToken();
  if (oauthToken) {
    console.log("Claude OAuth token loaded (Max plan)");
  }

  // Clipboard watcher
  const clipboardWatcher = new ClipboardWatcher();
  clipboardWatcher.start(async (entry) => {
    // Create clip object immediately
    const clip = {
      id: crypto.randomUUID(),
      type: entry.type,
      content: entry.content,
      contentHash: entry.contentHash,
      summary: entry.content.slice(0, 100),
      tags: [] as string[],
      mood: null as string | null,
      actions: [] as any[],
      sensitivity: null as string | null,
      sourceApp: entry.sourceApp,
      pinned: false,
      archived: false,
      createdAt: new Date().toISOString(),
      enriched: false,
    };

    // Save to SQLite + notify renderer
    insertClip(clip);
    mainWindow?.webContents.send("clip:new", clip);
    notifyClipCaptured(clip.summary, clip.type);

    // AI enrichment (async — update comes later)
    if (oauthToken && entry.type !== "image") {
      try {
        const result = await enrichClip({
          type: entry.type,
          content: entry.content.slice(0, 2000),
          oauthToken,
        });

        // Update clip with AI data
        clip.tags = result.tags;
        clip.summary = result.summary || clip.summary;
        clip.mood = result.mood;
        clip.actions = result.actions;
        clip.sensitivity = result.sensitivity;
        clip.enriched = true;

        // Update in DB + notify renderer
        updateClip(clip);
        mainWindow?.webContents.send("clip:updated", clip);
        console.log(`AI enriched: "${clip.summary}" [${clip.tags.join(", ")}]`);
      } catch (err: any) {
        console.error("AI enrichment failed:", err.message);
      }
    }
  });

  // System tray
  createTray(mainWindow);

  // Global hotkeys
  registerHotkeys(mainWindow);

  // IPC: Get all clips (from SQLite)
  ipcMain.handle("clips:list", () => getAllClips());

  // IPC: Delete clip
  ipcMain.handle("clips:delete", (_e, id: string) => {
    deleteClipById(id);
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

  // Window control IPC handlers
  ipcMain.on("window:minimize", () => mainWindow?.minimize());
  ipcMain.on("window:maximize", () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.on("window:close", () => mainWindow?.hide());

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

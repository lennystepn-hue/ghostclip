import { app, BrowserWindow, shell, ipcMain } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { ClipboardWatcher } from "./clipboard-watcher";
import { createTray } from "./tray";
import { registerHotkeys, unregisterHotkeys } from "./hotkeys";
import { notifyClipCaptured } from "./notifications";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#0f0f14",
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

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  // Clipboard watcher
  const clipboardWatcher = new ClipboardWatcher();
  clipboardWatcher.start((entry) => {
    mainWindow?.webContents.send("clipboard:change", entry);
    notifyClipCaptured(entry.content.slice(0, 50), entry.type);
  });

  // System tray
  createTray(mainWindow);

  // Global hotkeys
  registerHotkeys(mainWindow);

  // Window control IPC handlers
  ipcMain.on("window:minimize", () => mainWindow?.minimize());
  ipcMain.on("window:maximize", () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.on("window:close", () => mainWindow?.hide());

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on("will-quit", () => {
    clipboardWatcher.stop();
    unregisterHotkeys();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

export { mainWindow };

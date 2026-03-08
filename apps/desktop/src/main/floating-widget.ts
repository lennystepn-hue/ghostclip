import { BrowserWindow, screen, ipcMain } from "electron";
import { join } from "path";

let floatingWindow: BrowserWindow | null = null;
let isExpanded = false;

// Clippy character: 124x93 sprite + padding
const COLLAPSED_SIZE = { width: 140, height: 120 };
// Expanded: Clippy + panel
const EXPANDED_SIZE = { width: 420, height: 500 };

function getPosition(size: { width: number; height: number }) {
  const { workArea } = screen.getPrimaryDisplay();
  return {
    x: workArea.x + workArea.width - size.width - 16,
    y: workArea.y + workArea.height - size.height - 16,
  };
}

export function createFloatingWidget() {
  if (floatingWindow && !floatingWindow.isDestroyed()) {
    floatingWindow.show();
    return floatingWindow;
  }

  const pos = getPosition(COLLAPSED_SIZE);

  floatingWindow = new BrowserWindow({
    width: COLLAPSED_SIZE.width,
    height: COLLAPSED_SIZE.height,
    x: pos.x,
    y: pos.y,
    frame: false,
    transparent: process.platform !== "win32",
    backgroundColor: process.platform === "win32" ? "#00000000" : undefined,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  floatingWindow.loadFile(join(__dirname, "../renderer/index.html"), {
    query: { floatingWidget: "true" },
  });

  floatingWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  floatingWindow.setIgnoreMouseEvents(true, { forward: true });

  floatingWindow.on("closed", () => {
    floatingWindow = null;
    isExpanded = false;
  });

  return floatingWindow;
}

export function toggleFloatingWidget() {
  if (!floatingWindow || floatingWindow.isDestroyed()) {
    createFloatingWidget();
    return;
  }
  if (floatingWindow.isVisible()) {
    floatingWindow.hide();
  } else {
    floatingWindow.show();
  }
}

export function expandWidget() {
  if (!floatingWindow || floatingWindow.isDestroyed() || isExpanded) return;
  isExpanded = true;

  const pos = getPosition(EXPANDED_SIZE);
  floatingWindow.setBounds({
    x: pos.x,
    y: pos.y,
    width: EXPANDED_SIZE.width,
    height: EXPANDED_SIZE.height,
  });
  floatingWindow.setIgnoreMouseEvents(false);
  floatingWindow.setFocusable(true);
  floatingWindow.focus();
  floatingWindow.webContents.send("widget:expanded", true);
}

export function collapseWidget() {
  if (!floatingWindow || floatingWindow.isDestroyed() || !isExpanded) return;
  isExpanded = false;

  const pos = getPosition(COLLAPSED_SIZE);
  floatingWindow.setBounds({
    x: pos.x,
    y: pos.y,
    width: COLLAPSED_SIZE.width,
    height: COLLAPSED_SIZE.height,
  });
  floatingWindow.setIgnoreMouseEvents(true, { forward: true });
  floatingWindow.setFocusable(false);
  floatingWindow.webContents.send("widget:expanded", false);
}

export function sendToWidget(channel: string, data: any) {
  if (floatingWindow && !floatingWindow.isDestroyed()) {
    floatingWindow.webContents.send(channel, data);
  }
}

export function setupWidgetIPC() {
  ipcMain.on("widget:toggle-expand", () => {
    if (isExpanded) collapseWidget();
    else expandWidget();
  });

  ipcMain.on("widget:collapse", () => {
    collapseWidget();
  });

  ipcMain.on("widget:mouse-enter", () => {
    if (floatingWindow && !floatingWindow.isDestroyed() && !isExpanded) {
      floatingWindow.setIgnoreMouseEvents(false);
    }
  });

  ipcMain.on("widget:mouse-leave", () => {
    if (floatingWindow && !floatingWindow.isDestroyed() && !isExpanded) {
      floatingWindow.setIgnoreMouseEvents(true, { forward: true });
    }
  });
}

import { BrowserWindow, screen, ipcMain } from "electron";
import { join } from "path";

let floatingWindow: BrowserWindow | null = null;
let isExpanded = false;

const COLLAPSED_SIZE = { width: 52, height: 52 };
const EXPANDED_SIZE = { width: 360, height: 420 };

export function createFloatingWidget() {
  if (floatingWindow) {
    floatingWindow.show();
    return floatingWindow;
  }

  const { workAreaSize } = screen.getPrimaryDisplay();

  floatingWindow = new BrowserWindow({
    width: COLLAPSED_SIZE.width,
    height: COLLAPSED_SIZE.height,
    x: 16,
    y: workAreaSize.height - COLLAPSED_SIZE.height - 16,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: true,
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

  floatingWindow.on("closed", () => {
    floatingWindow = null;
    isExpanded = false;
  });

  // Blur = collapse
  floatingWindow.on("blur", () => {
    if (isExpanded) {
      collapseWidget();
    }
  });

  return floatingWindow;
}

export function toggleFloatingWidget() {
  if (!floatingWindow) {
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
  if (!floatingWindow || isExpanded) return;
  isExpanded = true;

  const { workAreaSize } = screen.getPrimaryDisplay();
  floatingWindow.setBounds({
    x: 16,
    y: workAreaSize.height - EXPANDED_SIZE.height - 16,
    width: EXPANDED_SIZE.width,
    height: EXPANDED_SIZE.height,
  });
  floatingWindow.webContents.send("widget:expanded", true);
}

export function collapseWidget() {
  if (!floatingWindow || !isExpanded) return;
  isExpanded = false;

  const { workAreaSize } = screen.getPrimaryDisplay();
  floatingWindow.setBounds({
    x: 16,
    y: workAreaSize.height - COLLAPSED_SIZE.height - 16,
    width: COLLAPSED_SIZE.width,
    height: COLLAPSED_SIZE.height,
  });
  floatingWindow.webContents.send("widget:expanded", false);
}

export function sendToWidget(channel: string, data: any) {
  floatingWindow?.webContents.send(channel, data);
}

export function setupWidgetIPC() {
  ipcMain.on("widget:toggle-expand", () => {
    if (isExpanded) {
      collapseWidget();
    } else {
      expandWidget();
    }
  });

  ipcMain.on("widget:collapse", () => {
    collapseWidget();
  });
}

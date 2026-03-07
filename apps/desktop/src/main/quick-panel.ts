import { BrowserWindow, screen } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";

let quickPanel: BrowserWindow | null = null;

export function createQuickPanel(): BrowserWindow {
  if (quickPanel && !quickPanel.isDestroyed()) {
    quickPanel.show();
    quickPanel.focus();
    return quickPanel;
  }

  const { x, y, width } = screen.getCursorScreenPoint()
    ? screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
    : screen.getPrimaryDisplay().workArea;

  // Target 60% of the display width; clamp to a comfortable min/max
  const panelWidth  = Math.round(Math.min(Math.max(width * 0.6, 720), 1100));
  const panelHeight = 560;

  quickPanel = new BrowserWindow({
    width: panelWidth,
    height: panelHeight,
    x: Math.round(x + (width - panelWidth) / 2),
    y: y + 60,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the same renderer but with a query parameter
  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    quickPanel.loadURL(process.env.ELECTRON_RENDERER_URL + "?quickpanel=true");
  } else {
    quickPanel.loadFile(join(__dirname, "../renderer/index.html"), { query: { quickpanel: "true" } });
  }

  quickPanel.on("ready-to-show", () => {
    quickPanel?.show();
    quickPanel?.focus();
  });

  quickPanel.on("blur", () => {
    quickPanel?.hide();
  });

  return quickPanel;
}

export function toggleQuickPanel() {
  if (quickPanel && !quickPanel.isDestroyed() && quickPanel.isVisible()) {
    quickPanel.hide();
  } else {
    createQuickPanel();
  }
}

export function hideQuickPanel() {
  if (quickPanel && !quickPanel.isDestroyed()) {
    quickPanel.hide();
  }
}

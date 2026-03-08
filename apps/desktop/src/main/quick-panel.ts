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

  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  const { x, y, width } = display.workArea;

  const panelWidth = Math.round(Math.min(Math.max(width * 0.6, 720), 1100));
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
    // Windows fix: use backgroundColor instead of transparent for reliability
    transparent: process.platform !== "win32",
    backgroundColor: process.platform === "win32" ? "#00000000" : undefined,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    quickPanel.loadURL(process.env.ELECTRON_RENDERER_URL + "?quickpanel=true");
  } else {
    quickPanel.loadFile(join(__dirname, "../renderer/index.html"), {
      query: { quickpanel: "true" },
    });
  }

  quickPanel.on("ready-to-show", () => {
    if (!quickPanel || quickPanel.isDestroyed()) return;
    quickPanel.show();
    // Windows: delay focus to avoid blur-on-show race condition
    setTimeout(() => {
      if (quickPanel && !quickPanel.isDestroyed()) {
        quickPanel.focus();
      }
    }, process.platform === "win32" ? 100 : 0);
  });

  quickPanel.on("blur", () => {
    // Small delay: prevents instant close on Windows when focus shifts briefly
    setTimeout(() => {
      if (quickPanel && !quickPanel.isDestroyed() && !quickPanel.isFocused()) {
        quickPanel.hide();
      }
    }, 80);
  });

  quickPanel.on("closed", () => {
    quickPanel = null;
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

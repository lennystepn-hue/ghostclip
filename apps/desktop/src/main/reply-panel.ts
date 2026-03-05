import { BrowserWindow, screen } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";
import { execSync } from "node:child_process";

let replyPanel: BrowserWindow | null = null;

/** Read X11 PRIMARY selection (text selected with mouse, not Ctrl+C) */
export function getX11Selection(): string {
  try {
    return execSync("xclip -selection primary -o", {
      encoding: "utf-8",
      timeout: 2000,
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

export function createReplyPanel(selectedText: string): BrowserWindow {
  if (replyPanel && !replyPanel.isDestroyed()) {
    replyPanel.webContents.send("reply:setText", selectedText);
    replyPanel.show();
    replyPanel.focus();
    return replyPanel;
  }

  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  const { x, y, width, height } = display.workArea;

  // Position near cursor but keep within screen bounds
  const panelWidth = 440;
  const panelHeight = 380;
  let px = Math.min(cursor.x, x + width - panelWidth - 20);
  let py = Math.min(cursor.y + 20, y + height - panelHeight - 20);
  px = Math.max(x, px);
  py = Math.max(y, py);

  replyPanel = new BrowserWindow({
    width: panelWidth,
    height: panelHeight,
    x: px,
    y: py,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    replyPanel.loadURL(process.env.ELECTRON_RENDERER_URL + "?replypanel=true");
  } else {
    replyPanel.loadFile(join(__dirname, "../renderer/index.html"), {
      query: { replypanel: "true" },
    });
  }

  replyPanel.on("ready-to-show", () => {
    replyPanel?.show();
    replyPanel?.focus();
    // Send the selected text after panel is ready
    replyPanel?.webContents.send("reply:setText", selectedText);
  });

  replyPanel.on("blur", () => {
    replyPanel?.hide();
  });

  return replyPanel;
}

export function showReplyPanel() {
  const selectedText = getX11Selection();
  if (!selectedText || selectedText.length < 3) {
    return; // Nothing meaningful selected
  }
  createReplyPanel(selectedText);
}

export function hideReplyPanel() {
  if (replyPanel && !replyPanel.isDestroyed()) {
    replyPanel.hide();
  }
}

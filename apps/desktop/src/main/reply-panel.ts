import { BrowserWindow, screen, clipboard } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";
import { execSync } from "node:child_process";

let replyPanel: BrowserWindow | null = null;

/** Read selected text (cross-platform) */
export function getSelectedText(): string {
  try {
    if (process.platform === "linux") {
      return execSync("xclip -selection primary -o", {
        encoding: "utf-8",
        timeout: 2000,
        stdio: ["pipe", "pipe", "ignore"],
      }).trim();
    }
    // Windows + macOS: fallback to clipboard content
    return clipboard.readText().trim();
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
    replyPanel.loadURL(process.env.ELECTRON_RENDERER_URL + "?replypanel=true");
  } else {
    replyPanel.loadFile(join(__dirname, "../renderer/index.html"), {
      query: { replypanel: "true" },
    });
  }

  replyPanel.on("ready-to-show", () => {
    if (!replyPanel || replyPanel.isDestroyed()) return;
    replyPanel.show();
    setTimeout(() => {
      if (replyPanel && !replyPanel.isDestroyed()) {
        replyPanel.focus();
        replyPanel.webContents.send("reply:setText", selectedText);
      }
    }, process.platform === "win32" ? 100 : 0);
  });

  replyPanel.on("blur", () => {
    setTimeout(() => {
      if (replyPanel && !replyPanel.isDestroyed() && !replyPanel.isFocused()) {
        replyPanel.hide();
      }
    }, 80);
  });

  replyPanel.on("closed", () => {
    replyPanel = null;
  });

  return replyPanel;
}

export function showReplyPanel() {
  const selectedText = getSelectedText();
  if (!selectedText || selectedText.length < 3) {
    return;
  }
  createReplyPanel(selectedText);
}

export function hideReplyPanel() {
  if (replyPanel && !replyPanel.isDestroyed()) {
    replyPanel.hide();
  }
}

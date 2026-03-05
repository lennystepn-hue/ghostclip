import { globalShortcut, BrowserWindow } from "electron";
import { toggleQuickPanel } from "./quick-panel";
import { showReplyPanel } from "./reply-panel";

export function registerHotkeys(mainWindow: BrowserWindow | null) {
  // Ctrl+Shift+V: Quick Panel
  globalShortcut.register("CmdOrCtrl+Shift+V", () => {
    toggleQuickPanel();
  });

  // Ctrl+Shift+F: Semantic Search
  globalShortcut.register("CmdOrCtrl+Shift+F", () => {
    mainWindow?.webContents.send("shortcut:search");
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Ctrl+Shift+R: Reply Suggestion (reads X11 PRIMARY selection)
  globalShortcut.register("CmdOrCtrl+Shift+R", () => {
    showReplyPanel();
  });

  // Ctrl+Shift+P: Pin last clip
  globalShortcut.register("CmdOrCtrl+Shift+P", () => {
    mainWindow?.webContents.send("shortcut:pin-last");
  });

  // Ctrl+Shift+S: Toggle Screen Context
  globalShortcut.register("CmdOrCtrl+Shift+S", () => {
    mainWindow?.webContents.send("shortcut:screen-context");
  });
}

export function unregisterHotkeys() {
  globalShortcut.unregisterAll();
}

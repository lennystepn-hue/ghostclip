import { globalShortcut, BrowserWindow } from "electron";

export function registerHotkeys(mainWindow: BrowserWindow | null) {
  // Ctrl+Shift+V: Quick Panel
  globalShortcut.register("CmdOrCtrl+Shift+V", () => {
    mainWindow?.webContents.send("shortcut:quick-panel");
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Ctrl+Shift+F: Semantic Search
  globalShortcut.register("CmdOrCtrl+Shift+F", () => {
    mainWindow?.webContents.send("shortcut:search");
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Ctrl+Shift+R: Reply Suggestion
  globalShortcut.register("CmdOrCtrl+Shift+R", () => {
    mainWindow?.webContents.send("shortcut:reply");
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

import { Tray, Menu, nativeImage, BrowserWindow, app } from "electron";
import { join } from "path";

let tray: Tray | null = null;

export function createTray(mainWindow: BrowserWindow | null): Tray {
  const iconPath = join(__dirname, "../../resources/tray-icon.png");
  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon);
  tray.setToolTip("GhostClip");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "GhostClip oeffnen",
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    {
      label: "Quick Panel",
      accelerator: "CmdOrCtrl+Shift+V",
      click: () => {
        mainWindow?.webContents.send("shortcut:quick-panel");
      },
    },
    { type: "separator" },
    {
      label: "Clipboard Watcher",
      type: "checkbox",
      checked: true,
      click: (menuItem) => {
        mainWindow?.webContents.send("watcher:toggle", menuItem.checked);
      },
    },
    {
      label: "Screen Context",
      type: "checkbox",
      checked: false,
      click: (menuItem) => {
        mainWindow?.webContents.send("screen-context:toggle", menuItem.checked);
      },
    },
    { type: "separator" },
    {
      label: "Einstellungen",
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send("navigate", "settings");
      },
    },
    { type: "separator" },
    {
      label: "Beenden",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Left click: show/hide main window
  tray.on("click", () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });

  return tray;
}

export function updateTrayBadge(count: number) {
  if (!tray) return;
  tray.setToolTip(count > 0 ? `GhostClip (${count} neu)` : "GhostClip");
}

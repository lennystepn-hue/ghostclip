import { Tray, Menu, nativeImage, BrowserWindow, app } from "electron";
import { join } from "path";
import { toggleFloatingWidget } from "./floating-widget";

let tray: Tray | null = null;
let dndMode = false;
let clipCount = 0;

export function createTray(mainWindow: BrowserWindow | null): Tray {
  const iconPath = join(__dirname, "../../resources/tray-icon.png");
  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon);
  tray.setToolTip("GhostClip");

  rebuildMenu(mainWindow);

  // Left click: show/hide main window
  tray.on("click", () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
      clipCount = 0;
      updateTrayTooltip();
    }
  });

  return tray;
}

function rebuildMenu(mainWindow: BrowserWindow | null) {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "GhostClip oeffnen",
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
        clipCount = 0;
        updateTrayTooltip();
      },
    },
    { type: "separator" },
    {
      label: "Quick Panel           Ctrl+Shift+V",
      click: () => {
        mainWindow?.webContents.send("shortcut:quick-panel");
      },
    },
    {
      label: "Antwort-Panel       Ctrl+Shift+R",
      click: () => {
        mainWindow?.webContents.send("shortcut:reply-panel");
      },
    },
    {
      label: "Floating Widget",
      click: () => toggleFloatingWidget(),
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
      label: "Nicht stoeren",
      type: "checkbox",
      checked: dndMode,
      click: (menuItem) => {
        dndMode = menuItem.checked;
        mainWindow?.webContents.send("dnd:toggle", dndMode);
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
    {
      label: "Analytics",
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send("navigate", "analytics");
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
}

function updateTrayTooltip() {
  if (!tray) return;
  if (dndMode) {
    tray.setToolTip("GhostClip (Nicht stoeren)");
  } else if (clipCount > 0) {
    tray.setToolTip(`GhostClip (${clipCount} neu)`);
  } else {
    tray.setToolTip("GhostClip");
  }
}

export function updateTrayBadge(count: number) {
  clipCount = count;
  updateTrayTooltip();
}

export function isDndMode(): boolean {
  return dndMode;
}

import { contextBridge, ipcRenderer } from "electron";

const api = {
  // Window controls
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),

  // Clipboard
  onClipboardChange: (callback: (data: any) => void) => {
    ipcRenderer.on("clipboard:change", (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners("clipboard:change");
  },

  // Clips
  getClips: () => ipcRenderer.invoke("clips:list"),
  createClip: (clip: any) => ipcRenderer.invoke("clips:create", clip),
  deleteClip: (id: string) => ipcRenderer.invoke("clips:delete", id),
  pinClip: (id: string) => ipcRenderer.invoke("clips:pin", id),
  archiveClip: (id: string) => ipcRenderer.invoke("clips:archive", id),
  searchClips: (query: string) => ipcRenderer.invoke("clips:search", query),

  // AI
  enrichClip: (content: string, type: string) =>
    ipcRenderer.invoke("ai:enrich", content, type),
  getReplies: (message: string) =>
    ipcRenderer.invoke("ai:replies", message),

  // Auth
  login: (email: string, password: string) =>
    ipcRenderer.invoke("auth:login", email, password),
  register: (email: string, password: string) =>
    ipcRenderer.invoke("auth:register", email, password),
  logout: () => ipcRenderer.invoke("auth:logout"),
  getUser: () => ipcRenderer.invoke("auth:user"),

  // Settings
  getSettings: () => ipcRenderer.invoke("settings:get"),
  updateSettings: (settings: any) =>
    ipcRenderer.invoke("settings:update", settings),

  // Screen context
  toggleScreenContext: () => ipcRenderer.invoke("screen-context:toggle"),
};

contextBridge.exposeInMainWorld("ghostclip", api);

export type GhostClipAPI = typeof api;

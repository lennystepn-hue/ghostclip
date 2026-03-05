import { contextBridge, ipcRenderer } from "electron";

const api = {
  // Window controls
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),

  // Clips
  getClips: () => ipcRenderer.invoke("clips:list"),
  deleteClip: (id: string) => ipcRenderer.invoke("clips:delete", id),
  pinClip: (id: string) => ipcRenderer.invoke("clips:pin", id),
  archiveClip: (id: string) => ipcRenderer.invoke("clips:archive", id),
  searchClips: (query: string) => ipcRenderer.invoke("clips:search", query),
  semanticSearch: (query: string) => ipcRenderer.invoke("clips:semanticSearch", query),
  writeClipboard: (text: string) => ipcRenderer.invoke("clipboard:write", text),
  clearAllClips: () => ipcRenderer.invoke("clips:clearAll"),

  // Clip events
  onClipNew: (callback: (clip: any) => void) => {
    ipcRenderer.on("clip:new", (_event, clip) => callback(clip));
    return () => ipcRenderer.removeAllListeners("clip:new");
  },
  onClipUpdated: (callback: (clip: any) => void) => {
    ipcRenderer.on("clip:updated", (_event, clip) => callback(clip));
    return () => ipcRenderer.removeAllListeners("clip:updated");
  },
  onClipsExpired: (callback: (count: number) => void) => {
    ipcRenderer.on("clips:expired", (_event, count) => callback(count));
    return () => ipcRenderer.removeAllListeners("clips:expired");
  },

  // AI
  getReplies: (message: string, context?: string) => ipcRenderer.invoke("ai:replies", message, context),
  aiChat: (message: string) => ipcRenderer.invoke("ai:chat", message),
  aiVision: (base64Image: string) => ipcRenderer.invoke("ai:vision", base64Image),

  // Analytics
  getStats: () => ipcRenderer.invoke("analytics:stats"),

  // Tags
  getTags: () => ipcRenderer.invoke("tags:list"),
  getClipsByTag: (tag: string) => ipcRenderer.invoke("tags:clips", tag),

  // Collections
  getCollections: () => ipcRenderer.invoke("collections:list"),
  createCollection: (name: string, icon: string) => ipcRenderer.invoke("collections:create", name, icon),
  deleteCollection: (id: string) => ipcRenderer.invoke("collections:delete", id),
  addClipToCollection: (collectionId: string, clipId: string) => ipcRenderer.invoke("collections:addClip", collectionId, clipId),
  removeClipFromCollection: (collectionId: string, clipId: string) => ipcRenderer.invoke("collections:removeClip", collectionId, clipId),

  // Settings
  getSettings: () => ipcRenderer.invoke("settings:get"),
  updateSetting: (key: string, value: string) => ipcRenderer.invoke("settings:update", key, value),

  // Screen context
  onActiveAppChange: (callback: (app: string) => void) => {
    ipcRenderer.on("context:activeApp", (_event, app) => callback(app));
    return () => ipcRenderer.removeAllListeners("context:activeApp");
  },

  // Sync
  syncStatus: () => ipcRenderer.invoke("sync:status"),
  connectSync: (token: string, server?: string) => ipcRenderer.invoke("sync:connect", token, server),

  // Encryption
  encryptionStatus: () => ipcRenderer.invoke("encryption:status"),
};

contextBridge.exposeInMainWorld("ghostclip", api);

export type GhostClipAPI = typeof api;

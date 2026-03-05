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
  openUrl: (url: string) => ipcRenderer.invoke("shell:openUrl", url),
  fetchUrl: (url: string) => ipcRenderer.invoke("url:fetch", url),
  clearAllClips: () => ipcRenderer.invoke("clips:clearAll"),
  importClips: (clips: any[]) => ipcRenderer.invoke("clips:import", clips),

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
  onReplyText: (callback: (text: string) => void) => {
    ipcRenderer.on("reply:setText", (_event, text) => callback(text));
    return () => ipcRenderer.removeAllListeners("reply:setText");
  },
  onReplySuggestions: (callback: (replies: any[]) => void) => {
    ipcRenderer.on("reply:suggestions", (_event, replies) => callback(replies));
    return () => ipcRenderer.removeAllListeners("reply:suggestions");
  },
  aiChat: (message: string) => ipcRenderer.invoke("ai:chat", message),
  aiVision: (base64Image: string) => ipcRenderer.invoke("ai:vision", base64Image),

  // Chat history
  getChatHistory: () => ipcRenderer.invoke("chat:history"),
  clearChatHistory: () => ipcRenderer.invoke("chat:clear"),

  // Devices
  getDevices: () => ipcRenderer.invoke("devices:list"),

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
  createSmartCollection: (name: string, icon: string, rule: object) => ipcRenderer.invoke("collections:createSmart", name, icon, rule),
  getSmartCollectionClips: (collectionId: string) => ipcRenderer.invoke("collections:smartClips", collectionId),

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

  // Floating Widget
  widgetToggleExpand: () => ipcRenderer.send("widget:toggle-expand"),
  widgetCollapse: () => ipcRenderer.send("widget:collapse"),
  widgetMouseEnter: () => ipcRenderer.send("widget:mouse-enter"),
  widgetMouseLeave: () => ipcRenderer.send("widget:mouse-leave"),
  onWidgetExpanded: (callback: (expanded: boolean) => void) => {
    ipcRenderer.on("widget:expanded", (_event, expanded) => callback(expanded));
    return () => ipcRenderer.removeAllListeners("widget:expanded");
  },
};

contextBridge.exposeInMainWorld("ghostclip", api);

export type GhostClipAPI = typeof api;

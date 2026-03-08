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
  recordPaste: (clipId: string) => ipcRenderer.invoke("clips:recordPaste", clipId),
  getPredictions: () => ipcRenderer.invoke("clips:predictions"),
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
  aiTransform: (content: string, mode: string, customInstruction?: string) => ipcRenderer.invoke("ai:transform", content, mode, customInstruction),
  getSimilarClips: (clipId: string) => ipcRenderer.invoke("clips:similar", clipId),

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

  // Clipboard Chains
  detectChain: () => ipcRenderer.invoke("chains:detect"),
  saveChain: (name: string, clipIds: string[], chainType: string) => ipcRenderer.invoke("chains:save", name, clipIds, chainType),
  getChainClips: (clipIds: string[]) => ipcRenderer.invoke("chains:getClips", clipIds),
  onChainDetected: (callback: (chain: any) => void) => {
    const handler = (_event: any, chain: any) => callback(chain);
    ipcRenderer.on("chain:detected", handler);
    return () => ipcRenderer.removeListener("chain:detected", handler);
  },

  // Work Context Detection
  getActiveContext: () => ipcRenderer.invoke("context:active"),
  getContexts: () => ipcRenderer.invoke("context:list"),
  getContextClips: (contextId: string) => ipcRenderer.invoke("context:clips", contextId),
  detectContexts: () => ipcRenderer.invoke("context:detect"),
  onContextUpdated: (callback: (ctx: any) => void) => {
    const handler = (_event: any, ctx: any) => callback(ctx);
    ipcRenderer.on("context:updated", handler);
    return () => ipcRenderer.removeListener("context:updated", handler);
  },
  onContextSwitched: (callback: (ctx: any) => void) => {
    const handler = (_event: any, ctx: any) => callback(ctx);
    ipcRenderer.on("context:switched", handler);
    return () => ipcRenderer.removeListener("context:switched", handler);
  },

  // Topics (AI Knowledge Base)
  getTopics: () => ipcRenderer.invoke("topics:list"),
  createTopic: (name: string, description: string, icon: string) => ipcRenderer.invoke("topics:create", name, description, icon),
  updateTopic: (id: string, name: string, description: string, icon: string) => ipcRenderer.invoke("topics:update", id, name, description, icon),
  deleteTopic: (id: string) => ipcRenderer.invoke("topics:delete", id),
  getTopicClips: (topicId: string) => ipcRenderer.invoke("topics:clips", topicId),
  getClipTopics: (clipId: string) => ipcRenderer.invoke("topics:forClip", clipId),
  assignClipToTopic: (clipId: string, topicId: string) => ipcRenderer.invoke("topics:assignClip", clipId, topicId),
  removeClipFromTopic: (clipId: string, topicId: string) => ipcRenderer.invoke("topics:removeClip", clipId, topicId),
  mergeTopics: (keepId: string, mergeId: string) => ipcRenderer.invoke("topics:merge", keepId, mergeId),
  searchTopics: (query: string) => ipcRenderer.invoke("topics:search", query),
  onTopicClipAssigned: (callback: (data: { clipId: string; topicId: string; topicName: string }) => void) => {
    ipcRenderer.on("topic:clipAssigned", (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners("topic:clipAssigned");
  },

  // Templates
  getTemplates: () => ipcRenderer.invoke("templates:list"),
  createTemplate: (name: string, content: string, category: string) => ipcRenderer.invoke("templates:create", name, content, category),
  updateTemplate: (id: string, name: string, content: string, category: string) => ipcRenderer.invoke("templates:update", id, name, content, category),
  deleteTemplate: (id: string) => ipcRenderer.invoke("templates:delete", id),
  useTemplate: (id: string, variables: Record<string, string>) => ipcRenderer.invoke("templates:use", id, variables),

  // Clipboard Rules
  getRules: () => ipcRenderer.invoke("rules:list"),
  createRule: (name: string, condType: string, condValue: string, actType: string, actValue: string) => ipcRenderer.invoke("rules:create", name, condType, condValue, actType, actValue),
  deleteRule: (id: string) => ipcRenderer.invoke("rules:delete", id),
  toggleRule: (id: string) => ipcRenderer.invoke("rules:toggle", id),

  // Settings
  getSettings: () => ipcRenderer.invoke("settings:get"),
  updateSetting: (key: string, value: string) => ipcRenderer.invoke("settings:update", key, value),

  // Screen context
  onActiveAppChange: (callback: (app: string) => void) => {
    ipcRenderer.on("context:activeApp", (_event, app) => callback(app));
    return () => ipcRenderer.removeAllListeners("context:activeApp");
  },

  // Template picker shortcut from global hotkey
  onShortcutTemplates: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on("shortcut:templates", listener);
    return () => ipcRenderer.removeListener("shortcut:templates", listener);
  },

  // Auth
  authState: () => ipcRenderer.invoke("auth:state"),
  authRegister: (email: string, password: string, server?: string) => ipcRenderer.invoke("auth:register", email, password, server),
  authLogin: (email: string, password: string, server?: string) => ipcRenderer.invoke("auth:login", email, password, server),
  authLogout: () => ipcRenderer.invoke("auth:logout"),

  // Claude AI (OAuth + API Key)
  aiStatus: () => ipcRenderer.invoke("ai:status"),
  oauthStatus: () => ipcRenderer.invoke("oauth:status"),
  oauthConnect: () => ipcRenderer.invoke("oauth:connect"),
  setApiKey: (key: string) => ipcRenderer.invoke("ai:setApiKey", key),
  removeApiKey: () => ipcRenderer.invoke("ai:removeApiKey"),

  // Updates
  updateCheck: () => ipcRenderer.invoke("update:check"),
  updateDownload: () => ipcRenderer.invoke("update:download"),
  updateInstall: () => ipcRenderer.invoke("update:install"),
  updateCurrentVersion: () => ipcRenderer.invoke("update:currentVersion"),
  onUpdateAvailable: (callback: (info: { version: string }) => void) => {
    ipcRenderer.on("update:available", (_e, info) => callback(info));
    return () => ipcRenderer.removeAllListeners("update:available");
  },
  onUpdateNotAvailable: (callback: () => void) => {
    ipcRenderer.on("update:not-available", () => callback());
    return () => ipcRenderer.removeAllListeners("update:not-available");
  },
  onUpdateProgress: (callback: (info: { percent: number }) => void) => {
    ipcRenderer.on("update:progress", (_e, info) => callback(info));
    return () => ipcRenderer.removeAllListeners("update:progress");
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on("update:downloaded", () => callback());
    return () => ipcRenderer.removeAllListeners("update:downloaded");
  },
  onUpdateError: (callback: (info: { message: string }) => void) => {
    ipcRenderer.on("update:error", (_e, info) => callback(info));
    return () => ipcRenderer.removeAllListeners("update:error");
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
  onClippyComment: (callback: (comment: string) => void) => {
    ipcRenderer.on("clippy:comment", (_event, comment) => callback(comment));
    return () => ipcRenderer.removeAllListeners("clippy:comment");
  },
};

contextBridge.exposeInMainWorld("ghostclip", api);

export type GhostClipAPI = typeof api;

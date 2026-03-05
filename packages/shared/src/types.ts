export interface User {
  id: string;
  email: string;
  plan: "free" | "pro" | "team";
  createdAt: Date;
}

export interface Device {
  id: string;
  userId: string;
  name: string;
  platform: "windows" | "mac" | "linux" | "web";
  lastSync: Date;
  publicKey: string;
}

export interface ClipEntry {
  id: string;
  userId: string;
  deviceId: string;
  type: "text" | "image" | "file" | "url";
  contentEnc: Buffer;
  previewEnc: Buffer | null;
  contentHash: string;
  createdAt: Date;
  sourceApp: string | null;
  pinned: boolean;
  archived: boolean;
  expiresAt: Date | null;
  tags: string[];
  summary: string | null;
  mood: string | null;
  actions: ClipAction[];
  relatedClips: string[];
  sensitivity: string | null;
  autoExpire: Date | null;
  aiRaw: Record<string, unknown> | null;
}

export interface ClipAction {
  label: string;
  type: "suggestion" | "reminder" | "link" | "template";
  payload: Record<string, unknown>;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  icon: string;
  smartRule: Record<string, unknown> | null;
  clipIds: string[];
}

export interface ReplyTemplate {
  id: string;
  userId: string;
  name: string;
  template: string;
  context: Record<string, unknown>;
  usageCount: number;
}

export interface AiEnrichmentResult {
  tags: string[];
  summary: string;
  mood: string;
  actions: ClipAction[];
  relatedTo: string[];
  sensitivity: string;
  autoExpire: Date | null;
}

export interface SyncMessage {
  type: "clip:new" | "clip:update" | "clip:delete" | "clip:pin" | "clip:archive";
  deviceId: string;
  timestamp: Date;
  payload: Record<string, unknown>;
}

export interface ReplySuggestion {
  id: string;
  text: string;
  tone: string;
  confidence: number;
}

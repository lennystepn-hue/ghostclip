export const PLANS = {
  free: {
    maxClips: 1000,
    maxDevices: 1,
    aiRequestsPerHour: 100,
    clipUploadsPerMinute: 60,
    hasSync: false,
    hasWebDashboard: false,
    hasReplySuggestions: false,
    hasScreenContext: false,
    hasSemanticSearch: false,
    hasAiChat: false,
    hasAnalytics: false,
  },
  pro: {
    maxClips: Infinity,
    maxDevices: 10,
    aiRequestsPerHour: 1000,
    clipUploadsPerMinute: 300,
    hasSync: true,
    hasWebDashboard: true,
    hasReplySuggestions: true,
    hasScreenContext: true,
    hasSemanticSearch: true,
    hasAiChat: true,
    hasAnalytics: true,
  },
  team: {
    maxClips: Infinity,
    maxDevices: Infinity,
    aiRequestsPerHour: 1000,
    clipUploadsPerMinute: 300,
    hasSync: true,
    hasWebDashboard: true,
    hasReplySuggestions: true,
    hasScreenContext: true,
    hasSemanticSearch: true,
    hasAiChat: true,
    hasAnalytics: true,
  },
} as const;

export const CLIPBOARD_POLL_INTERVAL = 500;
export const SCREEN_CONTEXT_INTERVAL = 10_000;
export const SYNC_HEARTBEAT_INTERVAL = 30_000;
export const AUTO_CLEANUP_INTERVAL = 3_600_000;
export const DEDUP_WINDOW = 5_000;
export const SENSITIVE_AUTO_EXPIRE = 5 * 60_000;
export const CONTEXT_BUFFER_MAX_AGE = 30 * 60_000;
export const JWT_EXPIRY = "15m";
export const REFRESH_TOKEN_EXPIRY = "30d";

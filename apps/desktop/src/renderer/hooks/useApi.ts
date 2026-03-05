import type { GhostClipAPI } from "../../preload/index";

/** Type-safe access to the ghostclip preload API */
export function useApi(): GhostClipAPI {
  return (window as any).ghostclip as GhostClipAPI;
}

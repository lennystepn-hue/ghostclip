import { useState, useEffect, useCallback } from "react";

interface Clip {
  id: string;
  type: "text" | "image" | "file" | "url";
  content?: string;
  summary: string | null;
  tags: string[];
  mood: string | null;
  actions: any[];
  sourceApp: string | null;
  pinned: boolean;
  archived: boolean;
  sensitivity: string | null;
  createdAt: string;
  enriched: boolean;
}

export function useClips() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClips = useCallback(async () => {
    try {
      setLoading(true);
      const api = (window as any).ghostclip;
      if (api?.getClips) {
        const stored = await api.getClips();
        setClips(stored || []);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClips();

    const api = (window as any).ghostclip;
    if (!api) return;

    // Listen for new clips
    const cleanupNew = api.onClipNew?.((clip: Clip) => {
      setClips((prev) => [clip, ...prev]);
    });

    // Listen for clip updates (AI enrichment)
    const cleanupUpdated = api.onClipUpdated?.((updated: Clip) => {
      setClips((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
    });

    return () => {
      cleanupNew?.();
      cleanupUpdated?.();
    };
  }, [loadClips]);

  const copyClip = useCallback((id: string) => {
    const clip = clips.find((c) => c.id === id);
    if (clip?.content) {
      navigator.clipboard.writeText(clip.content);
    } else if (clip?.summary) {
      navigator.clipboard.writeText(clip.summary);
    }
  }, [clips]);

  const pinClip = useCallback(async (id: string) => {
    const api = (window as any).ghostclip;
    await api?.pinClip?.(id);
  }, []);

  const archiveClip = useCallback(async (id: string) => {
    const api = (window as any).ghostclip;
    await api?.archiveClip?.(id);
  }, []);

  const deleteClip = useCallback(async (id: string) => {
    const api = (window as any).ghostclip;
    await api?.deleteClip?.(id);
    setClips((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { clips, loading, error, loadClips, copyClip, pinClip, archiveClip, deleteClip };
}

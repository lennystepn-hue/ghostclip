import { useState, useEffect, useCallback } from "react";

interface Clip {
  id: string;
  type: "text" | "image" | "file" | "url";
  summary: string | null;
  tags: string[];
  mood: string | null;
  sourceApp: string | null;
  pinned: boolean;
  archived: boolean;
  sensitivity: string | null;
  createdAt: string;
  contentEnc?: string;
}

export function useClips() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClips = useCallback(async () => {
    try {
      setLoading(true);
      // In production, this would call the API via preload bridge
      // For now, using demo data
      setClips([]);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClips();

    // Listen for new clips from clipboard watcher
    const cleanup = (window as any).ghostclip?.onClipboardChange?.(
      (entry: any) => {
        const newClip: Clip = {
          id: crypto.randomUUID(),
          type: entry.type,
          summary: entry.content?.slice(0, 100) || null,
          tags: [],
          mood: null,
          sourceApp: entry.sourceApp,
          pinned: false,
          archived: false,
          sensitivity: null,
          createdAt: new Date().toISOString(),
        };
        setClips((prev) => [newClip, ...prev]);
      },
    );

    return () => cleanup?.();
  }, [loadClips]);

  const pinClip = useCallback((id: string) => {
    setClips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)),
    );
  }, []);

  const archiveClip = useCallback((id: string) => {
    setClips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, archived: true } : c)),
    );
  }, []);

  const deleteClip = useCallback((id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { clips, loading, error, loadClips, pinClip, archiveClip, deleteClip };
}

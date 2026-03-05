import React, { useState, useMemo } from "react";
import { ClipCard, SearchBar } from "@ghostclip/ui";
import { useClips } from "../hooks/useClips";

interface ClipFeedProps {
  filter?: "all" | "pinned" | "today" | "week" | "archive";
}

export function ClipFeed({ filter = "all" }: ClipFeedProps) {
  const { clips, loading, pinClip, archiveClip, deleteClip } = useClips();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredClips = useMemo(() => {
    let result = clips;

    // Apply filter
    if (filter === "pinned") result = result.filter((c) => c.pinned);
    if (filter === "archive") result = result.filter((c) => c.archived);
    if (filter === "today") {
      const today = new Date().toDateString();
      result = result.filter(
        (c) => new Date(c.createdAt).toDateString() === today,
      );
    }
    if (filter === "week") {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      result = result.filter(
        (c) => new Date(c.createdAt).getTime() > weekAgo,
      );
    }
    if (filter !== "archive") result = result.filter((c) => !c.archived);

    // Apply search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.summary?.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [clips, filter, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-ghost-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Clips durchsuchen..."
        semantic={search.length > 3}
      />

      <div className="space-y-2">
        {filteredClips.map((clip) => (
          <ClipCard
            key={clip.id}
            {...clip}
            onClick={() => setSelectedId(clip.id)}
            onCopy={() => navigator.clipboard.writeText(clip.summary || "")}
            onPin={() => pinClip(clip.id)}
            onArchive={() => archiveClip(clip.id)}
            onDelete={() => deleteClip(clip.id)}
          />
        ))}

        {filteredClips.length === 0 && (
          <div className="text-center py-12">
            <p className="text-surface-600 text-sm">
              {search
                ? "Keine Clips gefunden"
                : "Noch keine Clips -- kopiere etwas!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

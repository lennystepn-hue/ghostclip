"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../utils";
import { SearchBar } from "./SearchBar";
import { ClipCard } from "./ClipCard";

interface QuickClip {
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
}

interface QuickPanelProps {
  clips: QuickClip[];
  onSearch: (query: string) => void;
  onClipCopy: (clipId: string) => void;
  onClipClick: (clipId: string) => void;
  onReply: (clipId: string) => void;
  className?: string;
}

export function QuickPanel({ clips, onSearch, onClipCopy, onClipClick, onReply, className }: QuickPanelProps) {
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (val: string) => {
    setSearchValue(val);
    onSearch(val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      className={cn(
        "w-[420px] max-h-[520px] rounded-2xl overflow-hidden",
        "bg-surface-100/95 backdrop-blur-xl border border-white/5",
        "shadow-glass-lg",
        className,
      )}
    >
      {/* Search */}
      <div className="p-3 border-b border-white/5">
        <SearchBar
          value={searchValue}
          onChange={handleSearch}
          placeholder="Suche in deinen Clips..."
          semantic={searchValue.length > 0}
        />
      </div>

      {/* Clip List */}
      <div className="overflow-y-auto max-h-[420px] p-2 space-y-1.5">
        {clips.map((clip) => (
          <ClipCard
            key={clip.id}
            {...clip}
            onClick={() => onClipClick(clip.id)}
            onCopy={() => onClipCopy(clip.id)}
            onReply={() => onReply(clip.id)}
          />
        ))}
        {clips.length === 0 && (
          <p className="text-center text-sm text-surface-600 py-8">Keine Clips gefunden</p>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-white/5 text-center">
        <p className="text-xs text-surface-600">
          ↑↓ navigieren · Enter einfuegen · Tab Details
        </p>
      </div>
    </motion.div>
  );
}

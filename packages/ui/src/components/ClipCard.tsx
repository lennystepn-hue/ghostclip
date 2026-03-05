"use client";
import React from "react";
import { motion } from "framer-motion";
import { Copy, Pin, Archive, Trash2, MessageSquare, Image, Link, FileText, Code } from "lucide-react";
import { cn } from "../utils";

interface ClipCardProps {
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
  deviceName?: string;
  onCopy?: () => void;
  onPin?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onReply?: () => void;
  onClick?: () => void;
}

const typeIcons = {
  text: FileText,
  image: Image,
  url: Link,
  file: Code,
};

export function ClipCard({
  type, summary, tags, mood, sourceApp, pinned, archived,
  sensitivity, createdAt, deviceName, onCopy, onPin, onArchive,
  onDelete, onReply, onClick,
}: ClipCardProps) {
  const Icon = typeIcons[type] || FileText;
  const timeAgo = getTimeAgo(createdAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={cn(
        "relative group cursor-pointer rounded-xl p-4",
        "bg-glass backdrop-blur-md border border-white/5",
        "shadow-glass hover:shadow-glass-lg transition-all duration-200",
        pinned && "ring-1 ring-ghost-500/30",
        archived && "opacity-60",
        sensitivity === "critical" && "ring-1 ring-accent-red/30",
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 text-ghost-400 shrink-0" />
          <p className="text-sm text-surface-900 truncate">
            {summary || "Kein Inhalt"}
          </p>
        </div>
        {pinned && <Pin className="w-3.5 h-3.5 text-ghost-400 shrink-0 fill-current" />}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-full bg-ghost-700/20 text-ghost-300 border border-ghost-700/20"
            >
              {tag}
            </span>
          ))}
          {tags.length > 5 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-surface-300 text-surface-800">
              +{tags.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 text-xs text-surface-700">
        <div className="flex items-center gap-2">
          {mood && <span className="text-surface-600">{mood}</span>}
          <span>{timeAgo}</span>
          {deviceName && <span>· {deviceName}</span>}
          {sourceApp && <span>· {sourceApp}</span>}
        </div>

        {/* Actions (visible on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onCopy && (
            <button onClick={(e) => { e.stopPropagation(); onCopy(); }} className="p-1 rounded hover:bg-surface-300 transition-colors">
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
          {onReply && (
            <button onClick={(e) => { e.stopPropagation(); onReply(); }} className="p-1 rounded hover:bg-surface-300 transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          )}
          {onPin && (
            <button onClick={(e) => { e.stopPropagation(); onPin(); }} className="p-1 rounded hover:bg-surface-300 transition-colors">
              <Pin className="w-3.5 h-3.5" />
            </button>
          )}
          {onArchive && (
            <button onClick={(e) => { e.stopPropagation(); onArchive(); }} className="p-1 rounded hover:bg-surface-300 transition-colors">
              <Archive className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded hover:bg-ghost-700/30 text-accent-red transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "gerade eben";
  if (mins < 60) return `vor ${mins} Min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `vor ${days}d`;
  return new Date(dateStr).toLocaleDateString("de-DE");
}

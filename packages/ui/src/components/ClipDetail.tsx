"use client";
import React from "react";
import { motion } from "framer-motion";
import { Copy, Pin, Archive, Trash2, Clock } from "lucide-react";
import { cn } from "../utils";
import { ReplyPanel } from "./ReplyPanel";

interface Reply {
  id: string;
  text: string;
  tone: string;
  confidence: number;
}

interface ClipDetailProps {
  type: "text" | "image" | "file" | "url";
  content: string;
  summary: string | null;
  tags: string[];
  mood: string | null;
  sourceApp: string | null;
  pinned: boolean;
  sensitivity: string | null;
  createdAt: string;
  actions: Array<{ label: string; type: string }>;
  replies?: Reply[];
  repliesLoading?: boolean;
  onCopy?: () => void;
  onPin?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onReplyCopy?: (reply: Reply) => void;
  className?: string;
}

export function ClipDetail({
  type, content, summary, tags, mood, sourceApp, pinned,
  sensitivity, createdAt, actions, replies, repliesLoading,
  onCopy, onPin, onArchive, onDelete, onReplyCopy, className,
}: ClipDetailProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("space-y-4", className)}
    >
      {/* Content */}
      <div className={cn(
        "p-4 rounded-xl",
        "bg-glass backdrop-blur-md border border-white/5 shadow-glass",
      )}>
        {type === "image" ? (
          <img src={content} alt={summary || ""} className="max-w-full rounded-lg" />
        ) : (
          <pre className="text-sm text-surface-900 whitespace-pre-wrap break-words font-mono leading-relaxed">
            {content}
          </pre>
        )}
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-2">
        {onCopy && (
          <button onClick={onCopy} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-ghost-600/20 text-ghost-300 hover:bg-ghost-600/30 transition-colors">
            <Copy className="w-4 h-4" /> Kopieren
          </button>
        )}
        {onPin && (
          <button onClick={onPin} className={cn("flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors", pinned ? "bg-ghost-600/20 text-ghost-300" : "bg-surface-300 text-surface-800 hover:bg-surface-400")}>
            <Pin className="w-4 h-4" /> {pinned ? "Angepinnt" : "Pinnen"}
          </button>
        )}
        {onArchive && (
          <button onClick={onArchive} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-surface-300 text-surface-800 hover:bg-surface-400 transition-colors">
            <Archive className="w-4 h-4" /> Archivieren
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-accent-red hover:bg-accent-red/10 transition-colors ml-auto">
            <Trash2 className="w-4 h-4" /> Loeschen
          </button>
        )}
      </div>

      {/* AI Insights */}
      <div className={cn(
        "p-4 rounded-xl space-y-3",
        "bg-glass backdrop-blur-md border border-white/5 shadow-glass",
      )}>
        <h3 className="text-sm font-medium text-surface-800">AI Insights</h3>

        {tags.length > 0 && (
          <div>
            <span className="text-xs text-surface-600">Tags:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-ghost-700/20 text-ghost-300 border border-ghost-700/20">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {mood && <div><span className="text-xs text-surface-600">Stimmung:</span> <span className="text-sm text-surface-900">{mood}</span></div>}
        {sensitivity && <div><span className="text-xs text-surface-600">Sensibilitaet:</span> <span className="text-sm text-surface-900">{sensitivity}</span></div>}

        {actions.length > 0 && (
          <div>
            <span className="text-xs text-surface-600">Vorschlaege:</span>
            <div className="space-y-1 mt-1">
              {actions.map((action, i) => (
                <button key={i} className="block w-full text-left px-3 py-1.5 text-sm rounded-lg bg-surface-300 hover:bg-surface-400 text-surface-800 transition-colors">
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-surface-600 pt-1">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(createdAt).toLocaleString("de-DE")}</span>
          {sourceApp && <span>via {sourceApp}</span>}
        </div>
      </div>

      {/* Reply Suggestions */}
      {(replies || repliesLoading) && (
        <ReplyPanel
          replies={replies || []}
          isLoading={repliesLoading}
          onCopy={onReplyCopy}
        />
      )}
    </motion.div>
  );
}

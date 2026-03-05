"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, ThumbsUp, Pencil } from "lucide-react";
import { cn } from "../utils";

interface Reply {
  id: string;
  text: string;
  tone: string;
  confidence: number;
}

interface ReplyPanelProps {
  replies: Reply[];
  isLoading?: boolean;
  onCopy?: (reply: Reply) => void;
  onEdit?: (reply: Reply) => void;
  onAccept?: (reply: Reply) => void;
  className?: string;
}

export function ReplyPanel({ replies, isLoading, onCopy, onEdit, onAccept, className }: ReplyPanelProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-medium text-surface-800 flex items-center gap-2">
        <span>Antwortvorschlaege</span>
        {isLoading && <div className="w-3 h-3 border-2 border-ghost-400 border-t-transparent rounded-full animate-spin" />}
      </h3>

      <AnimatePresence mode="popLayout">
        {replies.map((reply, i) => (
          <motion.div
            key={reply.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "p-3 rounded-xl",
              "bg-glass backdrop-blur-md border border-white/5",
              "shadow-glass hover:shadow-glass-lg transition-all duration-200",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="px-2 py-0.5 text-xs rounded-full bg-ghost-700/20 text-ghost-300">
                {reply.tone}
              </span>
              <span className="text-xs text-surface-600">
                {Math.round(reply.confidence * 100)}%
              </span>
            </div>
            <p className="mt-2 text-sm text-surface-900 leading-relaxed">{reply.text}</p>
            <div className="flex items-center gap-2 mt-3">
              {onCopy && (
                <button onClick={() => onCopy(reply)} className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-surface-300 hover:bg-surface-400 text-surface-800 transition-colors">
                  <Copy className="w-3 h-3" /> Kopieren
                </button>
              )}
              {onEdit && (
                <button onClick={() => onEdit(reply)} className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-surface-300 hover:bg-surface-400 text-surface-800 transition-colors">
                  <Pencil className="w-3 h-3" /> Bearbeiten
                </button>
              )}
              {onAccept && (
                <button onClick={() => onAccept(reply)} className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-ghost-600/20 hover:bg-ghost-600/30 text-ghost-300 transition-colors">
                  <ThumbsUp className="w-3 h-3" /> Nutzen
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

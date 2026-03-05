"use client";
import React from "react";
import { cn } from "../utils";

interface TagCloudProps {
  tags: Array<{ name: string; count: number }>;
  onTagClick?: (tag: string) => void;
  className?: string;
}

export function TagCloud({ tags, onTagClick, className }: TagCloudProps) {
  const maxCount = Math.max(...tags.map(t => t.count), 1);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tags.map(({ name, count }) => {
        const intensity = Math.ceil((count / maxCount) * 4);
        return (
          <button
            key={name}
            onClick={() => onTagClick?.(name)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200",
              "hover:scale-105 active:scale-95",
              intensity >= 4 && "bg-ghost-600/30 text-ghost-200 border border-ghost-500/30",
              intensity === 3 && "bg-ghost-700/20 text-ghost-300 border border-ghost-600/20",
              intensity === 2 && "bg-surface-300 text-surface-800 border border-surface-400",
              intensity <= 1 && "bg-surface-200 text-surface-700 border border-surface-300",
            )}
          >
            {name}
            <span className="ml-1 opacity-50">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

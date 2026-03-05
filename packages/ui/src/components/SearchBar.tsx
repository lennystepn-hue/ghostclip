"use client";
import React from "react";
import { Search, X, Sparkles } from "lucide-react";
import { cn } from "../utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  semantic?: boolean;
  className?: string;
}

export function SearchBar({ value, onChange, onSubmit, placeholder = "Suche...", semantic, className }: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <div className="relative flex items-center">
        {semantic ? (
          <Sparkles className="absolute left-3 w-4 h-4 text-ghost-400" />
        ) : (
          <Search className="absolute left-3 w-4 h-4 text-surface-700" />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit?.(value)}
          placeholder={placeholder}
          className={cn(
            "w-full pl-10 pr-10 py-2.5 rounded-xl",
            "bg-surface-200 border border-white/5",
            "text-sm text-surface-900 placeholder:text-surface-600",
            "focus:outline-none focus:ring-1 focus:ring-ghost-500/50 focus:border-ghost-500/30",
            "transition-all duration-200",
            semantic && "ring-1 ring-ghost-500/20",
          )}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 p-0.5 rounded hover:bg-surface-300 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-surface-700" />
          </button>
        )}
      </div>
      {semantic && (
        <p className="mt-1 text-xs text-ghost-400 ml-1">Semantische Suche aktiv</p>
      )}
    </div>
  );
}

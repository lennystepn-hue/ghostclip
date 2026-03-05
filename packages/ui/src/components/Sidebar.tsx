"use client";
import React from "react";
import { cn } from "../utils";
import { Clipboard, Pin, Tag, FolderOpen, Sparkles, MessageCircle, Clock, Calendar, Archive, Settings, User, BarChart3, Monitor } from "lucide-react";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  activeItem: string;
  onItemClick: (id: string) => void;
  clipCount?: number;
  className?: string;
}

const mainItems: SidebarItem[] = [
  { id: "feed", label: "Alle", icon: <Clipboard className="w-4 h-4" /> },
  { id: "pinned", label: "Gepinnt", icon: <Pin className="w-4 h-4" /> },
  { id: "tags", label: "Tags", icon: <Tag className="w-4 h-4" /> },
  { id: "collections", label: "Sammlungen", icon: <FolderOpen className="w-4 h-4" /> },
  { id: "smart", label: "Smart", icon: <Sparkles className="w-4 h-4" /> },
  { id: "chat", label: "Chat", icon: <MessageCircle className="w-4 h-4" /> },
  { id: "today", label: "Heute", icon: <Clock className="w-4 h-4" /> },
  { id: "week", label: "Woche", icon: <Calendar className="w-4 h-4" /> },
  { id: "archive", label: "Archiv", icon: <Archive className="w-4 h-4" /> },
];

const bottomItems: SidebarItem[] = [
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "devices", label: "Geraete", icon: <Monitor className="w-4 h-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  { id: "account", label: "Account", icon: <User className="w-4 h-4" /> },
];

export function Sidebar({ activeItem, onItemClick, clipCount, className }: SidebarProps) {
  return (
    <div className={cn("flex flex-col h-full w-52 py-4 px-2", "bg-surface-100 border-r border-white/5", className)}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 mb-6">
        <div className="w-7 h-7 rounded-lg bg-ghost-600 flex items-center justify-center">
          <Clipboard className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-surface-900 text-sm">GhostClip</span>
        {clipCount !== undefined && (
          <span className="ml-auto text-xs text-surface-600">{clipCount}</span>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-0.5">
        {mainItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150",
              activeItem === item.id
                ? "bg-ghost-600/15 text-ghost-300"
                : "text-surface-700 hover:text-surface-900 hover:bg-surface-200",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="h-px bg-white/5 my-2 mx-3" />

      {/* Bottom nav */}
      <nav className="space-y-0.5">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150",
              activeItem === item.id
                ? "bg-ghost-600/15 text-ghost-300"
                : "text-surface-700 hover:text-surface-900 hover:bg-surface-200",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

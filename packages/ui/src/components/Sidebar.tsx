"use client";
import React from "react";
import { cn } from "../utils";
import { Ghost, Clipboard, Tag, FolderOpen, Wand2, MessageCircle, Archive, Settings, User, BarChart3, LayoutGrid } from "lucide-react";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  activeItem: string;
  onItemClick: (id: string) => void;
  clipCount?: number;
  className?: string;
}

const mainItems: SidebarItem[] = [
  { id: "clips", label: "Clips", icon: <Clipboard className="w-4 h-4" /> },
  { id: "pinboard", label: "Pin Board", icon: <LayoutGrid className="w-4 h-4" /> },
  { id: "tags", label: "Tags", icon: <Tag className="w-4 h-4" /> },
  { id: "collections", label: "Sammlungen", icon: <FolderOpen className="w-4 h-4" /> },
  { id: "smart", label: "Smart", icon: <Wand2 className="w-4 h-4" /> },
  { id: "chat", label: "AI Chat", icon: <MessageCircle className="w-4 h-4" /> },
];

const bottomItems: SidebarItem[] = [
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  { id: "account", label: "Account", icon: <User className="w-4 h-4" /> },
];

function NavButton({ item, active, badge, onClick }: {
  item: SidebarItem; active: boolean; badge?: number; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 relative",
        active
          ? "bg-ghost-600/15 text-ghost-300"
          : "text-surface-700 hover:text-surface-900 hover:bg-white/[0.04]",
      )}
    >
      {/* Active indicator line with glow */}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-ghost-400 shadow-[0_0_8px_rgba(92,124,250,0.5)]" />
      )}
      <span className={cn(
        "transition-transform duration-200",
        active ? "scale-110" : "group-hover:scale-105",
      )}>
        {item.icon}
      </span>
      <span className="flex-1 text-left">{item.label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={cn(
          "text-[10px] font-semibold min-w-[18px] text-center px-1.5 py-0.5 rounded-full transition-colors duration-200",
          active ? "bg-ghost-600/25 text-ghost-300" : "bg-white/[0.06] text-surface-600",
        )}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

export function Sidebar({ activeItem, onItemClick, clipCount, className }: SidebarProps) {
  const getBadge = (id: string): number | undefined => {
    if (id === "clips" && clipCount) return clipCount;
    return undefined;
  };

  return (
    <div className={cn("flex flex-col h-full w-48 py-4 px-2", "bg-surface-100 border-r border-white/[0.04]", className)}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-6">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-ghost-500 to-ghost-700 flex items-center justify-center shadow-[0_0_12px_rgba(92,124,250,0.25)]">
          <Ghost className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-surface-900 text-sm tracking-tight">GhostClip</span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-0.5">
        {mainItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={activeItem === item.id}
            badge={getBadge(item.id)}
            onClick={() => onItemClick(item.id)}
          />
        ))}
      </nav>

      {/* Divider */}
      <div className="h-px bg-white/[0.04] my-2 mx-3" />

      {/* Bottom nav */}
      <nav className="space-y-0.5">
        {bottomItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={activeItem === item.id}
            onClick={() => onItemClick(item.id)}
          />
        ))}
      </nav>
    </div>
  );
}

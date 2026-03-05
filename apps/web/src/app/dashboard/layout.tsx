"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Ghost, Clipboard, Pin, Tag, FolderOpen, Sparkles, Clock, Calendar, Archive, Settings, User, BarChart3, Monitor, MessageSquare, LogOut } from "lucide-react";

const navItems = [
  { id: "feed", label: "Alle Clips", icon: Clipboard },
  { id: "pinned", label: "Gepinnt", icon: Pin },
  { id: "today", label: "Heute", icon: Clock },
  { id: "week", label: "Woche", icon: Calendar },
  { id: "archive", label: "Archiv", icon: Archive },
];

const toolItems = [
  { id: "chat", label: "AI Chat", icon: MessageSquare },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "devices", label: "Geraete", icon: Monitor },
];

const bottomItems = [
  { id: "settings", label: "Settings", icon: Settings },
  { id: "account", label: "Account", icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [activeItem, setActiveItem] = useState("feed");
  const router = useRouter();

  const handleNavigation = (id: string) => {
    setActiveItem(id);
    const routes: Record<string, string> = {
      feed: "/dashboard",
      pinned: "/dashboard?filter=pinned",
      today: "/dashboard?filter=today",
      week: "/dashboard?filter=week",
      archive: "/dashboard?filter=archive",
      chat: "/dashboard/chat",
      analytics: "/dashboard/analytics",
      devices: "/dashboard/devices",
      settings: "/dashboard/settings",
      account: "/dashboard/account",
    };
    router.push(routes[id] || "/dashboard");
  };

  const NavButton = ({ id, label, icon: Icon }: { id: string; label: string; icon: typeof Clipboard }) => (
    <button
      onClick={() => handleNavigation(id)}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
        activeItem === id
          ? "bg-ghost-600/15 text-ghost-300 font-medium"
          : "text-surface-700 hover:text-surface-900 hover:bg-white/[0.03]"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-[#0f0f14]">
      {/* Sidebar */}
      <aside className="flex flex-col h-full w-56 py-4 px-3 bg-surface-100/60 border-r border-white/[0.04] backdrop-blur-xl">
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 mb-7">
          <div className="relative w-7 h-7">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-ghost-500 to-ghost-700 blur-sm opacity-50" />
            <div className="relative w-full h-full rounded-lg bg-gradient-to-br from-ghost-500 to-ghost-700 flex items-center justify-center">
              <Ghost className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <span className="font-display font-semibold text-sm text-white tracking-tight">
            Ghost<span className="text-ghost-400">Clip</span>
          </span>
        </div>

        {/* Main nav */}
        <nav className="flex-1 space-y-0.5">
          <p className="px-3 text-[10px] font-medium text-surface-600 uppercase tracking-widest mb-2">Clips</p>
          {navItems.map((item) => (
            <NavButton key={item.id} {...item} />
          ))}

          <div className="h-px bg-white/[0.04] my-4 mx-3" />
          <p className="px-3 text-[10px] font-medium text-surface-600 uppercase tracking-widest mb-2">Tools</p>
          {toolItems.map((item) => (
            <NavButton key={item.id} {...item} />
          ))}
        </nav>

        {/* Bottom */}
        <div className="h-px bg-white/[0.04] my-2 mx-3" />
        <nav className="space-y-0.5">
          {bottomItems.map((item) => (
            <NavButton key={item.id} {...item} />
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

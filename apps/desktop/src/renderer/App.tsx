import React, { useState, useEffect } from "react";
import { Sidebar } from "@ghostclip/ui";
import { ClipFeed } from "./views/ClipFeed";
import { SettingsView } from "./views/SettingsView";
import { DevicesView } from "./views/DevicesView";
import { AnalyticsView } from "./views/AnalyticsView";
import { TagsView } from "./views/TagsView";
import { CollectionsView } from "./views/CollectionsView";
import { SmartView } from "./views/SmartView";
import { ChatView } from "./views/ChatView";
import { QuickPanelView } from "./views/QuickPanelView";
import { ReplyPanelView } from "./views/ReplyPanelView";

const viewTitles: Record<string, string> = {
  feed: "Alle Clips",
  pinned: "Gepinnte Clips",
  tags: "Tags",
  collections: "Sammlungen",
  smart: "Smart Clips",
  chat: "AI Chat",
  today: "Heute",
  week: "Diese Woche",
  archive: "Archiv",
  analytics: "Analytics",
  devices: "Geraete",
  settings: "Einstellungen",
  account: "Account",
};

export function App() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const isQuickPanel = params?.get("quickpanel") === "true";
  const isReplyPanel = params?.get("replypanel") === "true";

  const [activeView, setActiveView] = useState("feed");

  // Listen for navigation from main process
  useEffect(() => {
    if (isQuickPanel) return;
    const api = (window as any).ghostclip;
    if (!api) return;

    // Would listen for IPC events here in production
  }, [isQuickPanel]);

  if (isQuickPanel) {
    return <QuickPanelView />;
  }

  if (isReplyPanel) {
    return <ReplyPanelView />;
  }

  const renderView = () => {
    switch (activeView) {
      case "feed":
        return <ClipFeed filter="all" />;
      case "pinned":
        return <ClipFeed filter="pinned" />;
      case "today":
        return <ClipFeed filter="today" />;
      case "week":
        return <ClipFeed filter="week" />;
      case "tags":
        return <TagsView />;
      case "collections":
        return <CollectionsView />;
      case "smart":
        return <SmartView />;
      case "chat":
        return <ChatView />;
      case "archive":
        return <ClipFeed filter="archive" />;
      case "analytics":
        return <AnalyticsView />;
      case "devices":
        return <DevicesView />;
      case "settings":
        return <SettingsView />;
      default:
        return <ClipFeed filter="all" />;
    }
  };

  return (
    <div className="flex h-screen bg-surface-DEFAULT">
      {/* Title bar (frameless window) */}
      <div
        className="fixed top-0 left-0 right-0 h-8 flex items-center justify-end px-2 z-50"
        style={{ WebkitAppRegion: "drag" } as any}
      >
        <div
          className="flex gap-1"
          style={{ WebkitAppRegion: "no-drag" } as any}
        >
          <button
            onClick={() => (window as any).ghostclip?.minimize()}
            className="w-3 h-3 rounded-full bg-surface-500 hover:bg-yellow-500 transition-colors"
          />
          <button
            onClick={() => (window as any).ghostclip?.maximize()}
            className="w-3 h-3 rounded-full bg-surface-500 hover:bg-green-500 transition-colors"
          />
          <button
            onClick={() => (window as any).ghostclip?.close()}
            className="w-3 h-3 rounded-full bg-surface-500 hover:bg-red-500 transition-colors"
          />
        </div>
      </div>

      {/* Sidebar */}
      <div className="pt-8">
        <Sidebar activeItem={activeView} onItemClick={setActiveView} />
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-8 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-surface-900 mb-4">
            {viewTitles[activeView] || "GhostClip"}
          </h1>
          {renderView()}
        </div>
      </main>
    </div>
  );
}

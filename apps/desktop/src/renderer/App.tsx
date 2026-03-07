import React, { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "@ghostclip/ui";
import { ClipFeed } from "./views/ClipFeed";
import { SettingsView } from "./views/SettingsView";
import { AnalyticsView } from "./views/AnalyticsView";
import { TagsView } from "./views/TagsView";
import { CollectionsView } from "./views/CollectionsView";
import { SmartView } from "./views/SmartView";
import { ChatView } from "./views/ChatView";
import { QuickPanelView } from "./views/QuickPanelView";
import { ReplyPanelView } from "./views/ReplyPanelView";
import { AccountView } from "./views/AccountView";
import { FloatingWidget } from "./views/FloatingWidget";
import { PinBoardView } from "./views/PinBoardView";

export function App() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const isQuickPanel = params?.get("quickpanel") === "true";
  const isReplyPanel = params?.get("replypanel") === "true";
  const isFloatingWidget = params?.get("floatingWidget") === "true";

  const [activeView, setActiveView] = useState("clips");
  const [clipCount, setClipCount] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const prevView = useRef(activeView);

  const updateCounts = useCallback(async () => {
    const api = (window as any).ghostclip;
    if (!api?.getClips) return;
    const clips = await api.getClips();
    if (!clips) return;
    setClipCount(clips.filter((c: any) => !c.archived).length);
  }, []);

  useEffect(() => {
    if (isQuickPanel || isReplyPanel || isFloatingWidget) return;
    updateCounts();
    const api = (window as any).ghostclip;
    if (!api?.onClipNew) return;
    const cleanup = api.onClipNew(() => updateCounts());
    return cleanup;
  }, [isQuickPanel, isReplyPanel, isFloatingWidget, updateCounts]);

  const handleViewChange = (view: string) => {
    if (view === activeView) return;
    setTransitioning(true);
    prevView.current = activeView;
    setTimeout(() => {
      setActiveView(view);
      setTransitioning(false);
    }, 120);
  };

  if (isQuickPanel) return <QuickPanelView />;
  if (isReplyPanel) return <ReplyPanelView />;
  if (isFloatingWidget) return <FloatingWidget />;

  const renderView = () => {
    switch (activeView) {
      case "clips": return <ClipFeed />;
      case "pinboard": return <PinBoardView />;
      case "tags": return <TagsView />;
      case "collections": return <CollectionsView />;
      case "smart": return <SmartView />;
      case "chat": return <ChatView />;
      case "analytics": return <AnalyticsView />;
      case "settings": return <SettingsView />;
      case "account": return <AccountView />;
      default: return <ClipFeed />;
    }
  };

  return (
    <div className="flex h-screen bg-surface-DEFAULT" style={{ WebkitAppRegion: "no-drag" } as any}>
      {/* Page transition styles */}
      <style>{`
        @keyframes viewFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .view-enter { animation: viewFadeIn 0.2s ease-out both; }
        .view-exit { opacity: 0; transform: translateY(-4px); transition: all 0.12s ease-in; }
      `}</style>

      {/* Title bar (frameless window) */}
      <div
        className="fixed top-0 left-0 right-0 h-8 flex items-center justify-end px-2 z-50"
        style={{ WebkitAppRegion: "drag" } as any}
      >
        <div className="flex gap-1.5" style={{ WebkitAppRegion: "no-drag" } as any}>
          <button
            onClick={() => (window as any).ghostclip?.minimize()}
            className="w-3 h-3 rounded-full bg-surface-500/50 hover:bg-yellow-500 transition-colors duration-200"
          />
          <button
            onClick={() => (window as any).ghostclip?.maximize()}
            className="w-3 h-3 rounded-full bg-surface-500/50 hover:bg-green-500 transition-colors duration-200"
          />
          <button
            onClick={() => (window as any).ghostclip?.close()}
            className="w-3 h-3 rounded-full bg-surface-500/50 hover:bg-red-500 transition-colors duration-200"
          />
        </div>
      </div>

      {/* Sidebar */}
      <div className="pt-8">
        <Sidebar
          activeItem={activeView}
          onItemClick={handleViewChange}
          clipCount={clipCount}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-8 overflow-y-auto">
        <div
          className={`max-w-4xl mx-auto px-6 py-4 ${transitioning ? "view-exit" : "view-enter"}`}
          key={activeView}
        >
          {renderView()}
        </div>
      </main>
    </div>
  );
}

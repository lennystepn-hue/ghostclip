import React, { useState } from "react";
import { Sidebar } from "@ghostclip/ui";

export function App() {
  const [activeView, setActiveView] = useState("feed");

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
            onClick={() => (window as any).ghostclip.minimize()}
            className="w-3 h-3 rounded-full bg-surface-500 hover:bg-yellow-500 transition-colors"
          />
          <button
            onClick={() => (window as any).ghostclip.maximize()}
            className="w-3 h-3 rounded-full bg-surface-500 hover:bg-green-500 transition-colors"
          />
          <button
            onClick={() => (window as any).ghostclip.close()}
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
          <h1 className="text-2xl font-bold text-surface-900 mb-4">
            {activeView === "feed" && "Alle Clips"}
            {activeView === "pinned" && "Gepinnte Clips"}
            {activeView === "tags" && "Tags"}
            {activeView === "collections" && "Sammlungen"}
            {activeView === "smart" && "Smart Clips"}
            {activeView === "today" && "Heute"}
            {activeView === "week" && "Diese Woche"}
            {activeView === "archive" && "Archiv"}
            {activeView === "analytics" && "Analytics"}
            {activeView === "devices" && "Geraete"}
            {activeView === "settings" && "Einstellungen"}
            {activeView === "account" && "Account"}
          </h1>
          <p className="text-surface-700">
            GhostClip Desktop App — Content kommt in den naechsten Tasks.
          </p>
        </div>
      </main>
    </div>
  );
}

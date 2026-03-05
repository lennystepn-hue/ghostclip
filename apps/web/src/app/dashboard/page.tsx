"use client";
import React, { useState } from "react";
import { Search, X, Sparkles, Copy, Pin, Trash2, MessageSquare, FileText, Image, Link as LinkIcon, Code, MoreHorizontal } from "lucide-react";

const demoClips = [
  { id: "1", type: "text" as const, summary: "Hallo Max, kannst du mir bitte die Rechnung schicken?", tags: ["email", "max", "rechnung"], mood: "freundlich", sourceApp: "Outlook", pinned: true, sensitivity: null, time: "vor 2 Min" },
  { id: "2", type: "url" as const, summary: "https://github.com/ghostclip/ghostclip", tags: ["github", "repo", "open-source"], mood: "neutral", sourceApp: "Chrome", pinned: false, sensitivity: null, time: "vor 15 Min" },
  { id: "3", type: "text" as const, summary: "SELECT * FROM users WHERE email LIKE '%@ghostclip.com'", tags: ["sql", "query", "datenbank"], mood: null, sourceApp: "VS Code", pinned: false, sensitivity: "medium", time: "vor 1h" },
  { id: "4", type: "image" as const, summary: "Vodafone Rechnung — 47.99 EUR", tags: ["rechnung", "vodafone", "47.99"], mood: "geschaeftlich", sourceApp: "Firefox", pinned: false, sensitivity: null, time: "vor 3h" },
  { id: "5", type: "text" as const, summary: "Morgen 10 Uhr Meeting mit dem Design-Team, bitte Moodboard vorbereiten", tags: ["meeting", "design", "team"], mood: "arbeit", sourceApp: "Slack", pinned: false, sensitivity: null, time: "vor 5h" },
];

const typeIcons = { text: FileText, image: Image, url: LinkIcon, file: Code };

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const semantic = search.length > 3;

  const filtered = search
    ? demoClips.filter(c => c.summary?.toLowerCase().includes(search.toLowerCase()) || c.tags.some(t => t.includes(search.toLowerCase())))
    : demoClips;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Alle Clips</h1>
          <p className="text-sm text-surface-700 mt-1">{demoClips.length} Clips gespeichert</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="relative flex items-center">
          {semantic ? (
            <Sparkles className="absolute left-4 w-4 h-4 text-ghost-400" />
          ) : (
            <Search className="absolute left-4 w-4 h-4 text-surface-600" />
          )}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Clips durchsuchen... (tippe mehr fuer semantische Suche)"
            className={`w-full pl-11 pr-11 py-3 rounded-xl bg-surface-200/60 border text-sm text-white placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-ghost-500/40 focus:border-ghost-500/30 transition-all ${
              semantic ? "border-ghost-500/20" : "border-white/[0.05]"
            }`}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 p-0.5 rounded hover:bg-surface-300/30 transition-colors">
              <X className="w-3.5 h-3.5 text-surface-600" />
            </button>
          )}
        </div>
        {semantic && (
          <p className="mt-1.5 text-xs text-ghost-400 ml-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Semantische Suche aktiv
          </p>
        )}
      </div>

      {/* Clips list */}
      <div className="space-y-2">
        {filtered.map((clip) => {
          const Icon = typeIcons[clip.type] || FileText;
          return (
            <div
              key={clip.id}
              className={`group glass-card-hover rounded-xl px-5 py-4 cursor-pointer ${
                clip.pinned ? "ring-1 ring-ghost-500/20" : ""
              } ${clip.sensitivity === "medium" ? "ring-1 ring-accent-orange/20" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-surface-300/50 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-ghost-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white leading-relaxed">{clip.summary}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {clip.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 text-[11px] rounded-full bg-ghost-700/15 text-ghost-300/80 border border-ghost-700/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Meta + Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[11px] text-surface-600 font-mono">{clip.sourceApp}</span>
                    <br />
                    <span className="text-[11px] text-surface-600">{clip.time}</span>
                  </div>
                  {/* Hover actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button className="p-1.5 rounded-lg hover:bg-surface-300/30 text-surface-600 hover:text-white transition-all" title="Kopieren">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-surface-300/30 text-surface-600 hover:text-white transition-all" title="Antworten">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-surface-300/30 text-surface-600 hover:text-ghost-400 transition-all" title="Pinnen">
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-accent-red/10 text-surface-600 hover:text-accent-red transition-all" title="Loeschen">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mood indicator */}
              {clip.mood && (
                <div className="mt-2 ml-11">
                  <span className="text-[10px] text-surface-600 italic">{clip.mood}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

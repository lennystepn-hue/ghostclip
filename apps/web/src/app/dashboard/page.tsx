"use client";
import React, { useState } from "react";
import { ClipCard, SearchBar } from "@ghostclip/ui";

const demoClips = [
  { id: "1", type: "text" as const, summary: "Hallo Max, kannst du mir bitte die Rechnung schicken?", tags: ["email", "max", "rechnung"], mood: "freundlich", sourceApp: "Outlook", pinned: true, archived: false, sensitivity: null, createdAt: new Date().toISOString() },
  { id: "2", type: "url" as const, summary: "https://github.com/ghostclip/ghostclip", tags: ["github", "repo", "open-source"], mood: "neutral", sourceApp: "Chrome", pinned: false, archived: false, sensitivity: null, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "3", type: "text" as const, summary: "SELECT * FROM users WHERE email LIKE '%@ghostclip.com'", tags: ["sql", "query", "datenbank"], mood: null, sourceApp: "VS Code", pinned: false, archived: false, sensitivity: "medium", createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "4", type: "image" as const, summary: "Vodafone Rechnung - 47.99 EUR", tags: ["rechnung", "vodafone", "47.99"], mood: "geschaeftlich", sourceApp: "Firefox", pinned: false, archived: false, sensitivity: null, createdAt: new Date(Date.now() - 10800000).toISOString() },
];

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const filtered = search
    ? demoClips.filter(c => c.summary?.toLowerCase().includes(search.toLowerCase()) || c.tags.some(t => t.includes(search.toLowerCase())))
    : demoClips;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Alle Clips</h1>
      <SearchBar value={search} onChange={setSearch} placeholder="Clips durchsuchen..." semantic={search.length > 3} />
      <div className="space-y-2">
        {filtered.map(clip => (
          <ClipCard key={clip.id} {...clip} onCopy={() => {}} onPin={() => {}} onDelete={() => {}} />
        ))}
      </div>
    </div>
  );
}

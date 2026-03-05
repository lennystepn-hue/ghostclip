"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Search, X, Sparkles, Copy, Pin, Trash2, MessageSquare, FileText, Image, Link as LinkIcon, Code, Loader2 } from "lucide-react";
import { getClips, updateClip, deleteClip } from "@/lib/api";

interface Clip {
  id: string;
  type: "text" | "image" | "url" | "file";
  preview?: string;
  summary?: string;
  tags?: string[];
  pinned?: boolean;
  archived?: boolean;
  aiMetadata?: { mood?: string; sensitivity?: string; sourceApp?: string };
  createdAt?: string;
}

const typeIcons: Record<string, typeof FileText> = { text: FileText, image: Image, url: LinkIcon, file: Code };

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "gerade eben";
  if (mins < 60) return `vor ${mins} Min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours}h`;
  const days = Math.floor(hours / 24);
  return `vor ${days}d`;
}

export default function DashboardPage() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const semantic = search.length > 3;

  const loadClips = useCallback(async (searchQuery?: string) => {
    try {
      setLoading(true);
      setError("");
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;
      const data = await getClips(params);
      setClips(Array.isArray(data) ? data : []);
    } catch {
      setError("Clips konnten nicht geladen werden");
      setClips([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClips();
  }, [loadClips]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) {
        loadClips(search);
      } else {
        loadClips();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, loadClips]);

  const handleCopy = async (clip: Clip) => {
    const text = clip.preview || clip.summary || "";
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const handlePin = async (clip: Clip) => {
    try {
      const updated = await updateClip(clip.id, { pinned: !clip.pinned });
      setClips(prev => prev.map(c => c.id === clip.id ? { ...c, ...updated } : c));
    } catch {}
  };

  const handleDelete = async (clip: Clip) => {
    try {
      await deleteClip(clip.id);
      setClips(prev => prev.filter(c => c.id !== clip.id));
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Alle Clips</h1>
          <p className="text-sm text-surface-700 mt-1">{clips.length} Clips gespeichert</p>
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

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-accent-red/10 border border-accent-red/20 text-sm text-accent-red">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-ghost-400 animate-spin" />
          <span className="ml-2 text-sm text-surface-700">Clips werden geladen...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && clips.length === 0 && !error && (
        <div className="text-center py-16">
          <FileText className="w-10 h-10 text-surface-600 mx-auto mb-3" />
          <p className="text-surface-700 text-sm">
            {search ? "Keine Clips gefunden" : "Noch keine Clips vorhanden"}
          </p>
          <p className="text-surface-600 text-xs mt-1">
            {search ? "Versuch einen anderen Suchbegriff" : "Kopiere etwas in die Zwischenablage, um loszulegen"}
          </p>
        </div>
      )}

      {/* Clips list */}
      {!loading && (
        <div className="space-y-2">
          {clips.map((clip) => {
            const Icon = typeIcons[clip.type] || FileText;
            const tags = clip.tags || [];
            const mood = clip.aiMetadata?.mood;
            const sensitivity = clip.aiMetadata?.sensitivity;
            const sourceApp = clip.aiMetadata?.sourceApp;
            return (
              <div
                key={clip.id}
                className={`group glass-card-hover rounded-xl px-5 py-4 cursor-pointer ${
                  clip.pinned ? "ring-1 ring-ghost-500/20" : ""
                } ${sensitivity === "medium" ? "ring-1 ring-accent-orange/20" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-surface-300/50 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-ghost-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white leading-relaxed">{clip.summary || clip.preview || "(kein Inhalt)"}</p>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 text-[11px] rounded-full bg-ghost-700/15 text-ghost-300/80 border border-ghost-700/10">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meta + Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      {sourceApp && (
                        <>
                          <span className="text-[11px] text-surface-600 font-mono">{sourceApp}</span>
                          <br />
                        </>
                      )}
                      <span className="text-[11px] text-surface-600">{timeAgo(clip.createdAt)}</span>
                    </div>
                    {/* Hover actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button onClick={() => handleCopy(clip)} className="p-1.5 rounded-lg hover:bg-surface-300/30 text-surface-600 hover:text-white transition-all" title="Kopieren">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-surface-300/30 text-surface-600 hover:text-white transition-all" title="Antworten">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handlePin(clip)} className={`p-1.5 rounded-lg hover:bg-surface-300/30 transition-all ${clip.pinned ? "text-ghost-400" : "text-surface-600 hover:text-ghost-400"}`} title="Pinnen">
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(clip)} className="p-1.5 rounded-lg hover:bg-accent-red/10 text-surface-600 hover:text-accent-red transition-all" title="Loeschen">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mood indicator */}
                {mood && (
                  <div className="mt-2 ml-11">
                    <span className="text-[10px] text-surface-600 italic">{mood}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

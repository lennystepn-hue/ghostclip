"use client";
import React, { useEffect, useState } from "react";
import { AnalyticsBarChart, AnalyticsPieChart, TagCloud } from "@ghostclip/ui";
import { Loader2 } from "lucide-react";
import { getClipStats } from "@/lib/api";

interface Stats {
  total?: number;
  byType?: Record<string, number>;
  pinned?: number;
  thisWeek?: number;
  weeklyActivity?: { name: string; value: number }[];
  topTags?: { name: string; count: number }[];
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getClipStats();
        setStats(data);
      } catch {
        setError("Statistiken konnten nicht geladen werden");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fallback-Daten wenn API nicht verfuegbar
  const byType = stats?.byType || {};
  const typeData = Object.keys(byType).length > 0
    ? Object.entries(byType).map(([name, value]) => ({ name, value }))
    : [{ name: "Text", value: 0 }, { name: "Bilder", value: 0 }, { name: "URLs", value: 0 }];

  const weeklyData = stats?.weeklyActivity || [
    { name: "Mo", value: 0 }, { name: "Di", value: 0 }, { name: "Mi", value: 0 },
    { name: "Do", value: 0 }, { name: "Fr", value: 0 }, { name: "Sa", value: 0 }, { name: "So", value: 0 },
  ];

  const topTags = stats?.topTags || [];

  const summaryCards = [
    { l: "Clips gesamt", v: stats?.total?.toString() || "0" },
    { l: "Diese Woche", v: stats?.thisWeek?.toString() || "0" },
    { l: "Gepinnt", v: stats?.pinned?.toString() || "0" },
    { l: "Typen", v: Object.keys(byType).length.toString() || "0" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-ghost-400 animate-spin" />
        <span className="ml-2 text-sm text-surface-700">Statistiken werden geladen...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Analytics</h1>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-accent-red/10 border border-accent-red/20 text-sm text-accent-red">
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {summaryCards.map(s => (
          <div key={s.l} className="p-4 rounded-xl bg-glass border border-white/5 shadow-glass">
            <p className="text-2xl font-bold text-white">{s.v}</p>
            <p className="text-xs text-surface-600 mt-1">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <AnalyticsBarChart data={weeklyData} title="Aktivitaet diese Woche" />
        <AnalyticsPieChart data={typeData} title="Clip-Typen" />
      </div>
      {topTags.length > 0 && (
        <div className="p-4 rounded-xl bg-glass border border-white/5 shadow-glass">
          <h3 className="text-sm font-medium text-surface-800 mb-3">Top Tags</h3>
          <TagCloud tags={topTags} />
        </div>
      )}
    </div>
  );
}

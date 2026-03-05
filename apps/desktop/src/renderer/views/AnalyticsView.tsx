import React, { useState, useEffect } from "react";
import {
  AnalyticsBarChart,
  AnalyticsPieChart,
  TagCloud,
} from "@ghostclip/ui";

interface Stats {
  total: number;
  pinned: number;
  today: number;
  thisWeek: number;
  byType: Record<string, number>;
  topTags: { name: string; count: number }[];
  weeklyActivity: { name: string; value: number }[];
}

export function AnalyticsView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const api = (window as any).ghostclip;
    api?.getStats?.().then((s: any) => {
      setStats(s || null);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: "40px", color: "#5c5c75", textAlign: "center" }}>Laden...</div>;
  if (!stats) return <div style={{ padding: "40px", color: "#4a4a60", textAlign: "center" }}>Keine Statistiken verfuegbar.</div>;

  const typeData = Object.entries(stats.byType || {}).map(([name, value]) => ({ name, value }));
  const weeklyData = stats.weeklyActivity || [];
  const topTags = stats.topTags || [];

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Gesamt", value: String(stats.total || 0) },
          { label: "Heute", value: String(stats.today || 0) },
          { label: "Diese Woche", value: String(stats.thisWeek || 0) },
          { label: "Gepinnt", value: String(stats.pinned || 0) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl bg-glass border border-white/5 shadow-glass"
          >
            <p className="text-2xl font-bold text-surface-900">{stat.value}</p>
            <p className="text-xs text-surface-600 mt-1">{stat.label}</p>
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

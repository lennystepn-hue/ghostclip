import React, { useState, useEffect } from "react";
import {
  AnalyticsBarChart,
  AnalyticsPieChart,
  TagCloud,
} from "@ghostclip/ui";

export function AnalyticsView() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const api = (window as any).ghostclip;
    api?.getStats?.().then((s: any) => {
      setStats(s || null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
        <div style={{ width: "24px", height: "24px", border: "2px solid rgba(92,124,250,0.3)", borderTop: "2px solid #5c7cfa", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!stats) return <div style={{ padding: "40px", color: "#4a4a60", textAlign: "center" }}>Keine Statistiken verfuegbar.</div>;

  // Transform DB format → chart format
  // byType comes as [{type: "text", count: 5}, ...] → [{name, value}]
  const typeData = Array.isArray(stats.byType)
    ? stats.byType.map((t: any) => ({ name: t.type || t.name, value: t.count || t.value }))
    : Object.entries(stats.byType || {}).map(([name, value]) => ({ name, value }));

  // weeklyActivity comes as [{day: "2026-03-05", count: 3}] → [{name, value}]
  const weeklyData = (stats.weeklyActivity || []).map((d: any) => ({
    name: d.day ? new Date(d.day).toLocaleDateString("de-DE", { weekday: "short" }) : d.name,
    value: d.count ?? d.value ?? 0,
  }));

  // topTags comes as [{tag: "arbeit", count: 5}] → [{name, count}]
  const topTags = (stats.topTags || []).map((t: any) => ({
    name: t.tag || t.name,
    count: t.count,
  }));

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "Gesamt", value: stats.total || 0, color: "#5c7cfa" },
          { label: "Heute", value: stats.today || 0, color: "#22c55e" },
          { label: "Diese Woche", value: stats.thisWeek || 0, color: "#06b6d4" },
          { label: "Gepinnt", value: stats.pinned || 0, color: "#a855f7" },
        ].map((stat) => (
          <div key={stat.label} style={{
            padding: "16px 20px", borderRadius: "14px",
            background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            border: "1px solid rgba(255,255,255,0.05)",
          }}>
            <p style={{ fontSize: "28px", fontWeight: 700, color: stat.color }}>{stat.value}</p>
            <p style={{ fontSize: "11px", color: "#5c5c75", marginTop: "4px" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {(weeklyData.length > 0 || typeData.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {weeklyData.length > 0 && (
            <AnalyticsBarChart data={weeklyData} title="Aktivitaet diese Woche" />
          )}
          {typeData.length > 0 && (
            <AnalyticsPieChart data={typeData} title="Clip-Typen" />
          )}
        </div>
      )}

      {/* Empty state for charts */}
      {weeklyData.length === 0 && typeData.length === 0 && (
        <div style={{
          padding: "40px", borderRadius: "14px", textAlign: "center",
          background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
          border: "1px solid rgba(255,255,255,0.04)",
        }}>
          <p style={{ fontSize: "13px", color: "#5c5c75" }}>
            Kopiere ein paar Sachen — dann erscheinen hier Charts!
          </p>
        </div>
      )}

      {/* Top Tags */}
      {topTags.length > 0 && (
        <div style={{
          padding: "20px", borderRadius: "14px",
          background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
          border: "1px solid rgba(255,255,255,0.05)",
        }}>
          <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#8888a0", marginBottom: "12px" }}>Top Tags</h3>
          <TagCloud tags={topTags} />
        </div>
      )}

      {/* Insights */}
      {stats.total > 0 && (
        <div style={{
          padding: "16px 20px", borderRadius: "14px",
          background: "linear-gradient(135deg, rgba(66,99,235,0.06), rgba(168,85,247,0.04))",
          border: "1px solid rgba(92,124,250,0.1)",
        }}>
          <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#91a7ff", marginBottom: "8px" }}>Insights</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {stats.today > 0 && (
              <p style={{ fontSize: "12px", color: "#8888a0" }}>
                Du hast heute <strong style={{ color: "#e0e0e8" }}>{stats.today}</strong> Clips kopiert.
              </p>
            )}
            {typeData.length > 0 && (
              <p style={{ fontSize: "12px", color: "#8888a0" }}>
                Am haeufigsten kopiert: <strong style={{ color: "#e0e0e8" }}>
                  {typeData.sort((a: any, b: any) => b.value - a.value)[0]?.name}
                </strong>
              </p>
            )}
            {topTags.length > 0 && (
              <p style={{ fontSize: "12px", color: "#8888a0" }}>
                Top-Tag: <strong style={{ color: "#e0e0e8" }}>{topTags[0]?.name}</strong> ({topTags[0]?.count}x)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

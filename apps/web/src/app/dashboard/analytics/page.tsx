"use client";
import React from "react";
import { AnalyticsBarChart, AnalyticsPieChart, TagCloud } from "@ghostclip/ui";

export default function AnalyticsPage() {
  const weeklyData = [
    { name: "Mo", value: 89 }, { name: "Di", value: 72 }, { name: "Mi", value: 81 },
    { name: "Do", value: 68 }, { name: "Fr", value: 52 }, { name: "Sa", value: 23 }, { name: "So", value: 15 },
  ];
  const typeData = [
    { name: "Text", value: 234 }, { name: "Bilder", value: 42 },
    { name: "URLs", value: 67 }, { name: "Code", value: 89 }, { name: "Dateien", value: 15 },
  ];
  const topTags = [
    { name: "email", count: 67 }, { name: "code", count: 43 }, { name: "rechnung", count: 28 },
    { name: "github", count: 24 }, { name: "meeting", count: 15 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Analytics</h1>
      <div className="grid grid-cols-4 gap-3">
        {[{ l: "Clips diese Woche", v: "400" }, { l: "Bilder", v: "42" }, { l: "Code", v: "89" }, { l: "Gepinnt", v: "12" }].map(s => (
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
      <div className="p-4 rounded-xl bg-glass border border-white/5 shadow-glass">
        <h3 className="text-sm font-medium text-surface-800 mb-3">Top Tags</h3>
        <TagCloud tags={topTags} />
      </div>
    </div>
  );
}

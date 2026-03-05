import React from "react";
import {
  AnalyticsBarChart,
  AnalyticsPieChart,
  TagCloud,
} from "@ghostclip/ui";

export function AnalyticsView() {
  // Demo data
  const weeklyData = [
    { name: "Mo", value: 89 },
    { name: "Di", value: 72 },
    { name: "Mi", value: 81 },
    { name: "Do", value: 68 },
    { name: "Fr", value: 52 },
    { name: "Sa", value: 23 },
    { name: "So", value: 15 },
  ];

  const typeData = [
    { name: "Text", value: 234 },
    { name: "Bilder", value: 42 },
    { name: "URLs", value: 67 },
    { name: "Code", value: 89 },
    { name: "Dateien", value: 15 },
  ];

  const topTags = [
    { name: "email", count: 67 },
    { name: "code", count: 43 },
    { name: "rechnung", count: 28 },
    { name: "github", count: 24 },
    { name: "meeting", count: 15 },
    { name: "link", count: 12 },
    { name: "passwort", count: 8 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Clips diese Woche", value: "400" },
          { label: "Bilder", value: "42" },
          { label: "Code-Snippets", value: "89" },
          { label: "Gepinnt", value: "12" },
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

      <div className="p-4 rounded-xl bg-glass border border-white/5 shadow-glass">
        <h3 className="text-sm font-medium text-surface-800 mb-3">Top Tags</h3>
        <TagCloud tags={topTags} />
      </div>

      {/* AI Insights */}
      <div className="p-4 rounded-xl bg-glass border border-white/5 shadow-glass space-y-2">
        <h3 className="text-sm font-medium text-surface-800">AI Insights</h3>
        <div className="space-y-2">
          <p className="text-sm text-surface-700 p-2 rounded-lg bg-surface-200">
            Du kopierst deine IBAN sehr oft -- soll ich sie als Quick-Paste
            anlegen?
          </p>
          <p className="text-sm text-surface-700 p-2 rounded-lg bg-surface-200">
            Montags kopierst du 40% mehr als freitags -- hauptsaechlich Emails
          </p>
        </div>
      </div>
    </div>
  );
}

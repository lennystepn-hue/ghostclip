"use client";
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { cn } from "../utils";

interface BarChartData {
  name: string;
  value: number;
}

interface AnalyticsBarChartProps {
  data: BarChartData[];
  title: string;
  color?: string;
  className?: string;
}

export function AnalyticsBarChart({ data, title, color = "#5c7cfa", className }: AnalyticsBarChartProps) {
  return (
    <div className={cn("p-4 rounded-xl bg-glass backdrop-blur-md border border-white/5 shadow-glass", className)}>
      <h3 className="text-sm font-medium text-surface-800 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fill: "#8888a0", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#8888a0", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1a1a24", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, color: "#aaaac0" }}
          />
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const PIE_COLORS = ["#5c7cfa", "#a855f7", "#06b6d4", "#22c55e", "#f97316"];

interface PieData {
  name: string;
  value: number;
}

interface AnalyticsPieChartProps {
  data: PieData[];
  title: string;
  className?: string;
}

export function AnalyticsPieChart({ data, title, className }: AnalyticsPieChartProps) {
  return (
    <div className={cn("p-4 rounded-xl bg-glass backdrop-blur-md border border-white/5 shadow-glass", className)}>
      <h3 className="text-sm font-medium text-surface-800 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: "#1a1a24", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, color: "#aaaac0" }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs text-surface-700">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}

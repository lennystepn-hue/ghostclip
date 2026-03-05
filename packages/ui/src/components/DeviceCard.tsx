"use client";
import React from "react";
import { Monitor, Laptop, Smartphone, Globe, Trash2 } from "lucide-react";
import { cn } from "../utils";

interface DeviceCardProps {
  id: string;
  name: string;
  platform: "windows" | "mac" | "linux" | "web";
  isOnline: boolean;
  lastSync: string;
  clipCount?: number;
  onDeauthorize?: () => void;
}

const platformIcons = {
  windows: Monitor,
  mac: Laptop,
  linux: Monitor,
  web: Globe,
};

export function DeviceCard({ name, platform, isOnline, lastSync, clipCount, onDeauthorize }: DeviceCardProps) {
  const Icon = platformIcons[platform] || Monitor;

  return (
    <div className={cn(
      "p-4 rounded-xl",
      "bg-glass backdrop-blur-md border border-white/5",
      "shadow-glass",
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-300 flex items-center justify-center">
            <Icon className="w-5 h-5 text-surface-800" />
          </div>
          <div>
            <p className="text-sm font-medium text-surface-900">{name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-accent-green" : "bg-surface-600")} />
              <span className="text-xs text-surface-700">
                {isOnline ? "Online" : `Zuletzt: ${new Date(lastSync).toLocaleString("de-DE")}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-surface-600">
          {clipCount !== undefined && `${clipCount} Clips`} · {platform}
        </span>
        {onDeauthorize && (
          <button
            onClick={onDeauthorize}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg text-accent-red hover:bg-accent-red/10 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Entfernen
          </button>
        )}
      </div>
    </div>
  );
}

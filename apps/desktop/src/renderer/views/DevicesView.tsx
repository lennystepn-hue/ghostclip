import React from "react";
import { DeviceCard } from "@ghostclip/ui";

export function DevicesView() {
  // Demo data - in production, fetched from API
  const devices = [
    {
      id: "1",
      name: "Linux Workstation",
      platform: "linux" as const,
      isOnline: true,
      lastSync: new Date().toISOString(),
      clipCount: 342,
    },
    {
      id: "2",
      name: "MacBook Pro",
      platform: "mac" as const,
      isOnline: false,
      lastSync: new Date(Date.now() - 7200000).toISOString(),
      clipCount: 156,
    },
  ];

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-surface-600">
        {devices.length} Geraete verbunden
      </p>
      <div className="space-y-3">
        {devices.map((device) => (
          <DeviceCard
            key={device.id}
            {...device}
            onDeauthorize={() => console.log("Deauthorize", device.id)}
          />
        ))}
      </div>
      <button className="w-full px-4 py-3 text-sm rounded-xl bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors font-medium">
        Panic: Alle Daten ueberall sofort loeschen
      </button>
    </div>
  );
}

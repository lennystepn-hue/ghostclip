import React, { useState, useEffect } from "react";
import { DeviceCard } from "@ghostclip/ui";

interface Device {
  id: string;
  name: string;
  platform: "linux" | "mac" | "windows";
  isOnline: boolean;
  lastSync: string;
  clipCount: number;
  isCurrent?: boolean;
}

export function DevicesView() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const api = (window as any).ghostclip;

  useEffect(() => {
    api?.getDevices?.().then((result: Device[]) => {
      setDevices(result || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handlePanic = async () => {
    if (!confirm("ACHTUNG: Alle Clips unwiderruflich loeschen?")) return;
    await api?.clearAllClips?.();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-ghost-400/30 border-t-ghost-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-surface-600">
        {devices.length} {devices.length === 1 ? "Geraet" : "Geraete"} verbunden
      </p>
      <div className="space-y-3">
        {devices.map((device) => (
          <div key={device.id} className="relative">
            <DeviceCard
              {...device}
              onDeauthorize={() => console.log("Deauthorize", device.id)}
            />
            {device.isCurrent && (
              <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] rounded-full bg-ghost-600/20 text-ghost-300 border border-ghost-600/15">
                Dieses Geraet
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/5">
        <p className="text-xs text-surface-600 mb-3">
          Sync aktivieren: Einstellungen → Sync Token eingeben
        </p>
      </div>

      <button
        onClick={handlePanic}
        className="w-full px-4 py-3 text-sm rounded-xl bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors font-medium"
      >
        Panic: Alle Clips sofort loeschen
      </button>
    </div>
  );
}

import React, { useState } from "react";

interface Settings {
  clipboardWatcher: boolean;
  screenContext: boolean;
  notifications: boolean;
  autoExpireSensitive: boolean;
  autoExpireMinutes: number;
  excludedApps: string[];
  theme: "dark" | "light" | "system";
}

export function SettingsView() {
  const [settings, setSettings] = useState<Settings>({
    clipboardWatcher: true,
    screenContext: false,
    notifications: true,
    autoExpireSensitive: true,
    autoExpireMinutes: 5,
    excludedApps: [],
    theme: "dark",
  });

  const toggle = (key: keyof Settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <section>
        <h2 className="text-lg font-semibold text-surface-900 mb-4">
          Allgemein
        </h2>
        <div className="space-y-3">
          <SettingToggle
            label="Clipboard Watcher"
            description="Ueberwacht die Zwischenablage automatisch"
            checked={settings.clipboardWatcher as boolean}
            onChange={() => toggle("clipboardWatcher")}
          />
          <SettingToggle
            label="Benachrichtigungen"
            description="Desktop-Benachrichtigungen bei neuen Clips"
            checked={settings.notifications as boolean}
            onChange={() => toggle("notifications")}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-surface-900 mb-4">
          Privacy
        </h2>
        <div className="space-y-3">
          <SettingToggle
            label="Screen Context"
            description="Bildschirmkontext fuer bessere Vorschlaege (opt-in)"
            checked={settings.screenContext as boolean}
            onChange={() => toggle("screenContext")}
          />
          <SettingToggle
            label="Sensible Daten automatisch loeschen"
            description="Passwoerter und Tokens nach 5 Minuten entfernen"
            checked={settings.autoExpireSensitive as boolean}
            onChange={() => toggle("autoExpireSensitive")}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-surface-900 mb-4">
          Ausgeschlossene Apps
        </h2>
        <p className="text-sm text-surface-600 mb-2">
          Clips aus diesen Apps werden nicht erfasst
        </p>
        <div className="flex flex-wrap gap-2">
          {["1Password", "KeePass", "Banking"].map((app) => (
            <span
              key={app}
              className="px-3 py-1.5 text-sm rounded-lg bg-surface-300 text-surface-800 border border-surface-400"
            >
              {app} x
            </span>
          ))}
          <button className="px-3 py-1.5 text-sm rounded-lg bg-ghost-600/20 text-ghost-300 hover:bg-ghost-600/30 transition-colors">
            + Hinzufuegen
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-surface-900 mb-4">
          Danger Zone
        </h2>
        <div className="space-y-2">
          <button className="px-4 py-2 text-sm rounded-lg bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors">
            Alle lokalen Daten loeschen
          </button>
          <button className="px-4 py-2 text-sm rounded-lg bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors ml-2">
            Panic: Alles ueberall loeschen
          </button>
        </div>
      </section>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-glass border border-white/5">
      <div>
        <p className="text-sm font-medium text-surface-900">{label}</p>
        <p className="text-xs text-surface-600 mt-0.5">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`w-10 h-5 rounded-full transition-colors duration-200 relative ${
          checked ? "bg-ghost-600" : "bg-surface-400"
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Bell, Moon, LogOut, AlertTriangle, Check } from "lucide-react";
import { logout } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState({
    clipSaved: true,
    aiSummary: true,
    weeklyReport: false,
    sensitiveDetected: true,
  });
  const [saved, setSaved] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-ghost-400" />
        <h1 className="font-display text-xl font-bold text-white">Einstellungen</h1>
      </div>

      {/* Benachrichtigungen */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-ghost-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Benachrichtigungen</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: "clipSaved" as const, label: "Clip gespeichert", desc: "Benachrichtigung wenn ein neuer Clip erfasst wird" },
            { key: "aiSummary" as const, label: "AI-Zusammenfassung", desc: "Benachrichtigung wenn AI-Analyse abgeschlossen ist" },
            { key: "weeklyReport" as const, label: "Woechentlicher Bericht", desc: "Zusammenfassung deiner Clip-Aktivitaet per Email" },
            { key: "sensitiveDetected" as const, label: "Sensible Daten erkannt", desc: "Warnung wenn sensible Inhalte erkannt werden" },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">{item.label}</p>
                <p className="text-xs text-surface-600 mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => toggleNotification(item.key)}
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                  notifications[item.key] ? "bg-ghost-600" : "bg-surface-300"
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  notifications[item.key] ? "translate-x-5" : "translate-x-0.5"
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Design */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Moon className="w-4 h-4 text-ghost-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Design</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white">Dark Mode</p>
            <p className="text-xs text-surface-600 mt-0.5">GhostClip nutzt standardmaessig den dunklen Modus</p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-ghost-600/15 text-ghost-300 text-xs font-medium">
            Aktiv
          </div>
        </div>
      </div>

      {/* Speichern */}
      <button
        onClick={handleSave}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ghost-600 text-white text-sm font-semibold hover:bg-ghost-500 shadow-glow hover:shadow-glow-lg transition-all duration-300"
      >
        {saved ? (
          <>
            <Check className="w-4 h-4" />
            Gespeichert
          </>
        ) : (
          "Einstellungen speichern"
        )}
      </button>

      {/* Abmelden */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <LogOut className="w-4 h-4 text-ghost-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Sitzung</h2>
        </div>
        <p className="text-xs text-surface-600 mb-3">Melde dich von deinem Account ab. Deine Clips bleiben gespeichert.</p>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl border border-white/10 text-sm text-surface-800 hover:text-white hover:border-white/20 transition-all"
        >
          Abmelden
        </button>
      </div>

      {/* Gefahrenzone */}
      <div className="glass-card rounded-xl p-6 border-accent-red/10">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-accent-red" />
          <h2 className="text-sm font-semibold text-accent-red uppercase tracking-wider">Gefahrenzone</h2>
        </div>
        <p className="text-xs text-surface-600 mb-3">
          Account und alle Clips unwiderruflich loeschen. Diese Aktion kann nicht rueckgaengig gemacht werden.
        </p>
        <button className="px-4 py-2 rounded-xl bg-accent-red/10 border border-accent-red/20 text-sm text-accent-red hover:bg-accent-red/20 transition-all">
          Account loeschen
        </button>
      </div>
    </div>
  );
}

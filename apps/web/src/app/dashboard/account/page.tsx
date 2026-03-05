"use client";
import React, { useState, useEffect } from "react";
import { User, Key, Monitor, Crown, Mail } from "lucide-react";
import { getToken } from "@/lib/api";

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export default function AccountPage() {
  const [email, setEmail] = useState("--");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const token = getToken();
    if (token) {
      const payload = parseJwt(token);
      if (payload?.email) setEmail(payload.email as string);
    }
  }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <User className="w-5 h-5 text-ghost-400" />
        <h1 className="font-display text-xl font-bold text-white">Account</h1>
      </div>

      {/* Profil */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4 text-ghost-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Profil</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-ghost-500 to-ghost-700 flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-white font-medium">{email}</p>
            <p className="text-xs text-surface-600 mt-0.5">Mitglied seit Maerz 2026</p>
          </div>
        </div>
      </div>

      {/* Passwort aendern */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-ghost-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Passwort aendern</h2>
        </div>
        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs text-surface-700 mb-1.5 font-medium uppercase tracking-wider">Aktuelles Passwort</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-200/80 border border-white/[0.06] text-sm text-white placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-ghost-500/40 focus:border-ghost-500/30 transition-all"
              placeholder="Aktuelles Passwort"
            />
          </div>
          <div>
            <label className="block text-xs text-surface-700 mb-1.5 font-medium uppercase tracking-wider">Neues Passwort</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-200/80 border border-white/[0.06] text-sm text-white placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-ghost-500/40 focus:border-ghost-500/30 transition-all"
              placeholder="Neues Passwort (mind. 8 Zeichen)"
            />
          </div>
          <div>
            <label className="block text-xs text-surface-700 mb-1.5 font-medium uppercase tracking-wider">Passwort bestaetigen</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-200/80 border border-white/[0.06] text-sm text-white placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-ghost-500/40 focus:border-ghost-500/30 transition-all"
              placeholder="Nochmal eingeben"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-ghost-600 text-white text-sm font-semibold hover:bg-ghost-500 shadow-glow hover:shadow-glow-lg transition-all duration-300"
          >
            Passwort aktualisieren
          </button>
        </form>
      </div>

      {/* Verbundene Geraete */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Monitor className="w-4 h-4 text-ghost-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Verbundene Geraete</h2>
        </div>
        <div className="space-y-3">
          {[
            { name: "Dieses Geraet", type: "Web Browser", active: true },
            { name: "GhostClip Desktop", type: "Desktop App", active: false },
            { name: "GhostClip Mobile", type: "Mobile App", active: false },
          ].map(device => (
            <div key={device.name} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Monitor className="w-4 h-4 text-surface-600" />
                <div>
                  <p className="text-sm text-white">{device.name}</p>
                  <p className="text-xs text-surface-600">{device.type}</p>
                </div>
              </div>
              {device.active ? (
                <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-[11px] font-medium">
                  Aktiv
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-surface-300/50 text-surface-600 text-[11px] font-medium">
                  Nicht verbunden
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Plan */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-4 h-4 text-ghost-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Dein Plan</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white font-medium">Free</p>
            <p className="text-xs text-surface-600 mt-0.5">1.000 Clips, AI-Klassifizierung, 1 Geraet</p>
          </div>
          <button className="px-4 py-2 rounded-xl border border-ghost-500/30 text-sm text-ghost-400 hover:bg-ghost-600/10 hover:border-ghost-500/50 transition-all">
            Upgrade auf Pro
          </button>
        </div>
      </div>
    </div>
  );
}

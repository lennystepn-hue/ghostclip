"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Clipboard } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-DEFAULT p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-ghost-600 flex items-center justify-center">
            <Clipboard className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl text-white">GhostClip</span>
        </div>

        <div className="p-6 rounded-2xl bg-glass border border-white/5 shadow-glass-lg">
          <h2 className="text-lg font-semibold text-white mb-6">Account erstellen</h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-sm text-surface-800 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-200 border border-white/5 text-sm text-surface-900 focus:outline-none focus:ring-1 focus:ring-ghost-500/50" placeholder="deine@email.com" />
            </div>
            <div>
              <label className="block text-sm text-surface-800 mb-1">Passwort</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-200 border border-white/5 text-sm text-surface-900 focus:outline-none focus:ring-1 focus:ring-ghost-500/50" placeholder="Mind. 8 Zeichen" />
            </div>
            <div>
              <label className="block text-sm text-surface-800 mb-1">Passwort bestaetigen</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-200 border border-white/5 text-sm text-surface-900 focus:outline-none focus:ring-1 focus:ring-ghost-500/50" placeholder="Nochmal eingeben" />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-ghost-600 text-white font-medium hover:bg-ghost-700 transition-colors">
              Account erstellen
            </button>
          </form>
          <p className="text-xs text-surface-600 mt-4 text-center">
            Dein Passwort wird nie an unseren Server gesendet. Alles wird lokal verschluesselt.
          </p>
        </div>

        <p className="text-center text-sm text-surface-600 mt-4">
          Schon ein Account? <Link href="/auth/login" className="text-ghost-400 hover:underline">Anmelden</Link>
        </p>
      </div>
    </div>
  );
}

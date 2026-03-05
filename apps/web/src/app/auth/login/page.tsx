"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Ghost, Github, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f14] noise-overlay p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[20%] left-[30%] w-[400px] h-[400px] rounded-full bg-ghost-600/[0.06] blur-[100px]" />
        <div className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] rounded-full bg-accent-purple/[0.04] blur-[80px]" />
      </div>

      <div className="w-full max-w-[380px] relative z-10">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-10 group">
          <div className="relative w-11 h-11">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-ghost-500 to-ghost-700 blur-md opacity-60" />
            <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-ghost-500 to-ghost-700 flex items-center justify-center">
              <Ghost className="w-6 h-6 text-white" />
            </div>
          </div>
          <span className="font-display font-bold text-xl text-white tracking-tight">
            Ghost<span className="text-ghost-400">Clip</span>
          </span>
        </Link>

        <div className="glass-card rounded-2xl p-7 shadow-glass-lg">
          <h2 className="font-display text-xl font-semibold text-white mb-1">Willkommen zurueck</h2>
          <p className="text-sm text-surface-700 mb-7">Melde dich an, um auf deine Clips zuzugreifen.</p>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-xs text-surface-700 mb-1.5 font-medium uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-200/80 border border-white/[0.06] text-sm text-white placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-ghost-500/40 focus:border-ghost-500/30 transition-all" placeholder="deine@email.com" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs text-surface-700 font-medium uppercase tracking-wider">Passwort</label>
                <a href="#" className="text-xs text-ghost-400 hover:text-ghost-300 transition-colors">Vergessen?</a>
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-200/80 border border-white/[0.06] text-sm text-white placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-ghost-500/40 focus:border-ghost-500/30 transition-all" placeholder="••••••••" />
            </div>
            <button type="submit" className="group w-full py-3 rounded-xl bg-ghost-600 text-white font-semibold hover:bg-ghost-500 shadow-glow hover:shadow-glow-lg transition-all duration-300 flex items-center justify-center gap-2">
              Anmelden
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
            <div className="relative flex justify-center"><span className="bg-[#171720] px-3 text-xs text-surface-600 font-medium">oder weiter mit</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-3 rounded-xl glass-card text-surface-800 text-sm font-medium hover:text-white hover:border-white/15 transition-all duration-200">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 py-3 rounded-xl glass-card text-surface-800 text-sm font-medium hover:text-white hover:border-white/15 transition-all duration-200">
              <Github className="w-4 h-4" />
              GitHub
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-surface-600 mt-6">
          Noch kein Account?{" "}
          <Link href="/auth/register" className="text-ghost-400 hover:text-ghost-300 font-medium transition-colors">Registrieren</Link>
        </p>
      </div>
    </div>
  );
}

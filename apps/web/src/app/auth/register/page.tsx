"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ghost, Shield, ArrowRight, Loader2 } from "lucide-react";
import { register } from "@/lib/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwoerter stimmen nicht ueberein");
      return;
    }
    if (password.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }
    setLoading(true);
    try {
      await register(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registrierung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f14] noise-overlay p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[20%] right-[30%] w-[400px] h-[400px] rounded-full bg-ghost-600/[0.06] blur-[100px]" />
        <div className="absolute bottom-[30%] left-[20%] w-[300px] h-[300px] rounded-full bg-accent-cyan/[0.04] blur-[80px]" />
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
          <h2 className="font-display text-xl font-semibold text-white mb-1">Account erstellen</h2>
          <p className="text-sm text-surface-700 mb-7">Starte kostenlos mit 1.000 Clips und AI-Klassifizierung.</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-accent-red/10 border border-accent-red/20 text-sm text-accent-red">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs text-surface-700 mb-1.5 font-medium uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-200/80 border border-white/[0.06] text-sm text-white placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-ghost-500/40 focus:border-ghost-500/30 transition-all" placeholder="deine@email.com" />
            </div>
            <div>
              <label className="block text-xs text-surface-700 mb-1.5 font-medium uppercase tracking-wider">Passwort</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-200/80 border border-white/[0.06] text-sm text-white placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-ghost-500/40 focus:border-ghost-500/30 transition-all" placeholder="Mind. 8 Zeichen" />
            </div>
            <div>
              <label className="block text-xs text-surface-700 mb-1.5 font-medium uppercase tracking-wider">Passwort bestaetigen</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-200/80 border border-white/[0.06] text-sm text-white placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-ghost-500/40 focus:border-ghost-500/30 transition-all" placeholder="Nochmal eingeben" />
            </div>
            <button type="submit" disabled={loading} className="group w-full py-3 rounded-xl bg-ghost-600 text-white font-semibold hover:bg-ghost-500 shadow-glow hover:shadow-glow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Account erstellen
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-2 mt-5 px-1">
            <Shield className="w-3.5 h-3.5 text-ghost-400 shrink-0" />
            <p className="text-[11px] text-surface-600 leading-relaxed">
              Dein Passwort wird nie an unseren Server gesendet. Alles wird lokal mit AES-256 verschluesselt.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-surface-600 mt-6">
          Schon ein Account?{" "}
          <Link href="/auth/login" className="text-ghost-400 hover:text-ghost-300 font-medium transition-colors">Anmelden</Link>
        </p>
      </div>
    </div>
  );
}

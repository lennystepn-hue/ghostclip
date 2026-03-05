import Link from "next/link";
import { Clipboard, Shield, Zap, Brain, Monitor, Globe } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-DEFAULT">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-ghost-600 flex items-center justify-center">
            <Clipboard className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white">GhostClip</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm text-surface-800 hover:text-white transition-colors">Login</Link>
          <Link href="/auth/register" className="px-4 py-2 text-sm rounded-lg bg-ghost-600 text-white hover:bg-ghost-700 transition-colors">
            Kostenlos starten
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-8 py-24">
        <h1 className="text-5xl font-bold text-white leading-tight max-w-3xl mx-auto">
          Dein Clipboard,{" "}
          <span className="bg-gradient-to-r from-ghost-400 to-accent-purple bg-clip-text text-transparent">
            supercharged mit AI
          </span>
        </h1>
        <p className="text-lg text-surface-800 mt-6 max-w-xl mx-auto">
          GhostClip merkt sich alles, was du kopierst. AI versteht den Inhalt, schlaegt Antworten vor und synchronisiert sicher zwischen all deinen Geraeten.
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link href="/auth/register" className="px-6 py-3 rounded-xl bg-ghost-600 text-white font-medium hover:bg-ghost-700 shadow-glow transition-all">
            Kostenlos starten
          </Link>
          <a href="#features" className="px-6 py-3 rounded-xl bg-surface-200 text-surface-900 font-medium hover:bg-surface-300 transition-colors">
            Features ansehen
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-8 py-20">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "AI-Klassifizierung", desc: "Jeder Clip wird automatisch analysiert, getaggt und kategorisiert — frei und dynamisch." },
            { icon: Shield, title: "E2E Verschluesselt", desc: "Deine Clip-Inhalte sind AES-256-GCM verschluesselt. Wir koennen sie nie lesen." },
            { icon: Zap, title: "Blitzschnell", desc: "Unter 500ms Sync-Latenz. Kopiere auf dem Laptop, paste auf dem Desktop." },
            { icon: Monitor, title: "Cross-Platform", desc: "Windows, Mac, Linux — ueberall der gleiche Account, ueberall deine Clips." },
            { icon: Globe, title: "Web Dashboard", desc: "Greife von ueberall auf deine Clips zu. Suche, analysiere, chatte mit der AI." },
            { icon: Clipboard, title: "Smart Replies", desc: "Kopiere eine Nachricht, bekomme sofort drei Antwortvorschlaege in deinem Stil." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl bg-glass border border-white/5 shadow-glass">
              <Icon className="w-8 h-8 text-ghost-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-surface-800 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-8 py-20 bg-surface-100">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Pricing</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6">
          {[
            { plan: "Free", price: "0", features: ["1.000 Clips", "1 Geraet", "AI-Klassifizierung", "Lokale Suche"], cta: "Kostenlos starten" },
            { plan: "Pro", price: "6", features: ["Unlimited Clips", "10 Geraete", "Cloud Sync", "Reply-Suggestions", "Web Dashboard", "AI Chat", "Analytics"], cta: "Pro werden", highlight: true },
            { plan: "Team", price: "12", features: ["Alles aus Pro", "Shared Collections", "Team Dashboard", "SSO/SAML", "Audit Log"], cta: "Team starten" },
          ].map(({ plan, price, features, cta, highlight }) => (
            <div key={plan} className={`p-6 rounded-2xl border ${highlight ? "bg-ghost-600/10 border-ghost-500/30 shadow-glow" : "bg-glass border-white/5 shadow-glass"}`}>
              <h3 className="text-lg font-semibold text-white">{plan}</h3>
              <p className="mt-2"><span className="text-3xl font-bold text-white">{price}&#8364;</span><span className="text-surface-700">/Monat</span></p>
              <ul className="mt-6 space-y-2">
                {features.map(f => (
                  <li key={f} className="text-sm text-surface-800 flex items-center gap-2">
                    <span className="text-ghost-400">&#10003;</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register" className={`block text-center mt-6 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${highlight ? "bg-ghost-600 text-white hover:bg-ghost-700" : "bg-surface-300 text-surface-900 hover:bg-surface-400"}`}>
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 border-t border-white/5 text-center text-sm text-surface-700">
        &copy; 2026 GhostClip. Open Source.
      </footer>
    </div>
  );
}

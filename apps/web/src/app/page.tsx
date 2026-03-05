import Link from "next/link";
import { Clipboard, Shield, Zap, Brain, Monitor, Globe, ArrowRight, Check, Ghost, Sparkles, Lock, Cpu, Download, Apple, MonitorDot } from "lucide-react";

function GhostLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`${className} relative`}>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-ghost-500 to-ghost-700 blur-md opacity-60" />
      <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-ghost-500 to-ghost-700 flex items-center justify-center">
        <Ghost className="w-[55%] h-[55%] text-white" />
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f0f14] noise-overlay relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-ghost-600/[0.07] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent-purple/[0.05] blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-accent-cyan/[0.04] blur-[80px]" />
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 lg:px-12 py-5 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5 group">
            <GhostLogo className="w-9 h-9" />
            <span className="font-display font-bold text-lg text-white tracking-tight">
              Ghost<span className="text-ghost-400">Clip</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <a href="https://github.com/lennystepn-hue/ghostclip" target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm text-surface-800 hover:text-white transition-colors duration-200 font-medium">
              GitHub
            </a>
            <a href="#download" className="px-5 py-2.5 text-sm rounded-xl bg-ghost-600 text-white hover:bg-ghost-500 transition-all duration-200 font-medium shadow-glow hover:shadow-glow-lg flex items-center gap-2">
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          </div>
        </nav>

        {/* Hero */}
        <section className="text-center px-6 pt-20 pb-28 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-xs text-surface-800 font-medium mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-ghost-400" />
            AI-powered Clipboard Intelligence
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight animate-slide-up">
            Dein Clipboard,
            <br />
            <span className="text-gradient">supercharged mit AI</span>
          </h1>

          <p className="text-lg sm:text-xl text-surface-800 mt-7 max-w-2xl mx-auto leading-relaxed font-light animate-slide-up" style={{ animationDelay: "0.1s" }}>
            GhostClip merkt sich alles, was du kopierst. AI analysiert, taggt und verknuepft —
            verschluesselt synchronisiert zwischen all deinen Geraeten.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <a href="#download" className="group px-8 py-3.5 rounded-2xl bg-ghost-600 text-white font-semibold hover:bg-ghost-500 shadow-glow hover:shadow-glow-lg transition-all duration-300 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Kostenlos downloaden
            </a>
            <a href="#features" className="px-8 py-3.5 rounded-2xl glass-card text-surface-900 font-semibold hover:text-white transition-all duration-300">
              Features ansehen
            </a>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-12 mt-16 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {[
              { value: "< 500ms", label: "Sync-Latenz" },
              { value: "AES-256", label: "Verschluesselung" },
              { value: "3", label: "Plattformen" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-xl font-display font-bold text-white">{value}</div>
                <div className="text-xs text-surface-700 mt-1 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Floating UI preview */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="glass-card rounded-2xl p-1 shadow-glass-lg">
            <div className="bg-surface-100/80 rounded-xl p-6">
              {/* Mock UI header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-accent-red/60" />
                <div className="w-3 h-3 rounded-full bg-accent-orange/60" />
                <div className="w-3 h-3 rounded-full bg-accent-green/60" />
                <span className="ml-3 text-xs text-surface-600 font-mono">GhostClip — Dashboard</span>
              </div>
              <div className="grid grid-cols-12 gap-4">
                {/* Sidebar mock */}
                <div className="col-span-3 space-y-1">
                  {["Alle Clips", "Gepinnt", "Heute", "Woche", "Archiv"].map((item, i) => (
                    <div key={item} className={`px-3 py-2 rounded-lg text-xs ${i === 0 ? "bg-ghost-600/15 text-ghost-300 font-medium" : "text-surface-700"}`}>
                      {item}
                    </div>
                  ))}
                </div>
                {/* Clips mock */}
                <div className="col-span-9 space-y-2">
                  {[
                    { app: "Chrome", text: "Meeting Notes — Q1 Planning", tags: ["arbeit", "meeting"], time: "vor 2 Min" },
                    { app: "VS Code", text: "const encrypt = (data, key) => ...", tags: ["code", "crypto"], time: "vor 15 Min" },
                    { app: "Slack", text: "Kannst du mir die Rechnung schicken?", tags: ["nachricht", "rechnung"], time: "vor 1h" },
                  ].map((clip) => (
                    <div key={clip.text} className="glass-card rounded-xl px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] text-surface-600 font-mono w-14 shrink-0">{clip.app}</span>
                        <span className="text-sm text-surface-900 truncate">{clip.text}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        {clip.tags.map(t => (
                          <span key={t} className="px-2 py-0.5 text-[10px] rounded-full bg-ghost-700/20 text-ghost-300 border border-ghost-700/15">{t}</span>
                        ))}
                        <span className="text-[10px] text-surface-600 ml-2">{clip.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 py-24 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Alles, was dein Clipboard braucht
            </h2>
            <p className="text-surface-800 mt-4 text-lg font-light max-w-xl mx-auto">
              Sechs Saeulen fuer das intelligenteste Clipboard der Welt.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Brain, title: "AI-Klassifizierung", desc: "Jeder Clip wird automatisch analysiert, frei getaggt und intelligent verknuepft. Keine starren Kategorien — die AI entscheidet dynamisch.", color: "from-ghost-500 to-accent-purple" },
              { icon: Lock, title: "E2E Verschluesselt", desc: "AES-256-GCM Verschluesselung. Dein Master Key verlasst nie dein Geraet. Wir koennen deine Clips nie lesen.", color: "from-accent-cyan to-ghost-500" },
              { icon: Zap, title: "Realtime Sync", desc: "Unter 500ms Latenz. WebSocket-basiert. Kopiere auf dem Laptop, paste auf dem Desktop — sofort.", color: "from-accent-orange to-accent-pink" },
              { icon: Monitor, title: "Cross-Platform", desc: "Windows, Mac, Linux — ein Account, ueberall deine Clips. Electron Desktop App + Web Dashboard.", color: "from-accent-green to-accent-cyan" },
              { icon: Globe, title: "AI Chat", desc: "Frag die AI ueber deine gesamte Clipboard-Historie. Findet Links, Nachrichten, Code — alles was du je kopiert hast.", color: "from-accent-purple to-accent-pink" },
              { icon: Cpu, title: "Smart Replies", desc: "Kopiere eine Nachricht — bekomme sofort drei Antwortvorschlaege in deinem persoenlichen Stil.", color: "from-ghost-400 to-ghost-700" },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <div
                key={title}
                className="glass-card-hover rounded-2xl p-6 group animate-slide-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display text-base font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-surface-700 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 py-24 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
              So funktioniert&apos;s
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Kopieren", desc: "Kopiere irgendetwas — Text, Bilder, URLs, Code. GhostClip erfasst es automatisch im Hintergrund." },
              { step: "02", title: "AI analysiert", desc: "Claude AI taggt, kategorisiert und verknuepft den Clip in Echtzeit. Komplett frei und dynamisch." },
              { step: "03", title: "Ueberall nutzen", desc: "Verschluesselt synchronisiert auf all deinen Geraeten. Suche semantisch, lass dir Antworten vorschlagen." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="font-mono text-5xl font-bold text-ghost-600/20 mb-4">{step}</div>
                <h3 className="font-display text-lg font-semibold text-white mb-3">{title}</h3>
                <p className="text-sm text-surface-700 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Download */}
        <section className="px-6 py-24 max-w-5xl mx-auto" id="download">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Download GhostClip
            </h2>
            <p className="text-surface-800 mt-4 text-lg font-light">Kostenlos. Open Source. Fuer alle Plattformen.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { platform: "Linux", icon: MonitorDot, formats: ["AppImage", "deb"], desc: "Ubuntu, Debian, Fedora, Arch — alle gaengigen Distros.", primary: "AppImage", highlight: true },
              { platform: "macOS", icon: Apple, formats: ["dmg"], desc: "Intel & Apple Silicon. macOS 12+ empfohlen.", primary: "dmg" },
              { platform: "Windows", icon: Monitor, formats: ["exe"], desc: "Windows 10/11. Installer mit Auto-Update.", primary: "exe" },
            ].map(({ platform, icon: Icon, formats, desc, primary, highlight }) => (
              <div
                key={platform}
                className={`rounded-2xl p-7 transition-all duration-300 ${
                  highlight
                    ? "glass-card border-ghost-500/30 shadow-glow relative"
                    : "glass-card-hover"
                }`}
              >
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-ghost-600 text-white text-xs font-semibold">
                    Empfohlen
                  </div>
                )}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ghost-500 to-ghost-700 flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white">{platform}</h3>
                <p className="text-sm text-surface-700 mt-2 mb-6 leading-relaxed">{desc}</p>
                <div className="space-y-2">
                  {formats.map(f => (
                    <a
                      key={f}
                      href={`https://github.com/lennystepn-hue/ghostclip/releases/latest/download/GhostClip.${f}`}
                      className={`flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        f === primary
                          ? "bg-ghost-600 text-white hover:bg-ghost-500 shadow-glow hover:shadow-glow-lg"
                          : "glass-card text-surface-900 hover:text-white hover:border-white/15"
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      .{f} herunterladen
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-surface-600 mt-8">
            Alle Features inklusive. Keine Registrierung noetig. Deine Daten bleiben lokal.
          </p>
        </section>

        {/* CTA */}
        <section className="px-6 py-24 max-w-3xl mx-auto text-center">
          <div className="glass-card rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-ghost-600/10 to-accent-purple/5 pointer-events-none" />
            <div className="relative">
              <GhostLogo className="w-14 h-14 mx-auto mb-6" />
              <h2 className="font-display text-3xl font-bold text-white mb-4">
                Bereit fuer ein smarteres Clipboard?
              </h2>
              <p className="text-surface-800 mb-8 text-lg font-light">
                Installiere GhostClip und erlebe wie AI dein Clipboard transformiert.
              </p>
              <a href="#download" className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-ghost-600 text-white font-semibold hover:bg-ghost-500 shadow-glow hover:shadow-glow-lg transition-all duration-300 text-lg">
                <Download className="w-5 h-5" />
                Jetzt downloaden
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-10 border-t border-white/[0.04] max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GhostLogo className="w-6 h-6" />
              <span className="font-display font-semibold text-sm text-surface-700">GhostClip</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-surface-600">
              <a href="#features" className="hover:text-surface-800 transition-colors">Features</a>
              <a href="#download" className="hover:text-surface-800 transition-colors">Download</a>
              <a href="https://github.com/lennystepn-hue/ghostclip" target="_blank" rel="noopener noreferrer" className="hover:text-surface-800 transition-colors">GitHub</a>
            </div>
            <span className="text-xs text-surface-600">&copy; 2026 GhostClip. Open Source.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

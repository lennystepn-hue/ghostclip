<div align="center">

<!-- Logo -->
<br/>
<img width="80" src="https://api.iconify.design/lucide:clipboard-check.svg?color=%235c7cfa" alt="GhostClip"/>
<br/>

# GhostClip

**AI-Powered Clipboard Manager with E2E Encrypted Cloud Sync**

[![CI](https://img.shields.io/badge/build-passing-22c55e?style=flat-square&logo=github-actions&logoColor=white)](https://github.com/lennystepn-hue/ghostclip/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-5c7cfa?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-a855f7?style=flat-square)](CONTRIBUTING.md)
[![Electron](https://img.shields.io/badge/Electron-33-47848f?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000?style=flat-square&logo=next.js)](https://nextjs.org/)

<br/>

[Features](#-features) · [Screenshots](#-screenshots) · [Quick Start](#-quick-start) · [Architecture](#-architecture) · [Tech Stack](#-tech-stack) · [Deployment](#-deployment) · [Contributing](#-contributing)

<br/>
</div>

---

## What is GhostClip?

> Copy once, find it everywhere. GhostClip remembers everything you copy, understands it with AI, and syncs it securely across all your devices.

GhostClip runs silently in the background, capturing every clipboard entry — text, images, URLs, code, files. Each clip gets analyzed by AI in real-time: auto-tagged, summarized, and classified. Smart reply suggestions, semantic search, and a beautiful dashboard let you access and leverage your clipboard history like never before.

**Your data stays yours.** All clip content is encrypted client-side with AES-256-GCM before it ever leaves your machine. The server never sees your plaintext data.

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🧠 AI-Powered Intelligence
- **Free classification** — no fixed categories, AI decides dynamically
- **Smart tags** generated for every clip
- **Reply suggestions** in 3 tones (casual, formal, friendly)
- **AI Chat** — ask questions about your clipboard history
- **Vision & OCR** — understands images and screenshots

</td>
<td width="50%">

### 🔒 Security First
- **AES-256-GCM** encryption for all clip content
- **PBKDF2** key derivation (600,000 iterations)
- **Zero-knowledge** — server never sees plaintext
- **2FA support** (TOTP)
- **Auto-expire** sensitive data (passwords, tokens)

</td>
</tr>
<tr>
<td width="50%">

### 🔄 Seamless Sync
- **Real-time** WebSocket sync (< 500ms latency)
- **Offline queue** — works without internet
- **Conflict resolution** built-in
- **Up to 10 devices** synced simultaneously
- **Panic button** — wipe all data everywhere

</td>
<td width="50%">

### 🖥️ Cross-Platform
- **Windows** (.exe installer)
- **macOS** (.dmg, Apple Silicon + Intel)
- **Linux** (.AppImage, .deb, .rpm)
- **Web Dashboard** — access from any browser
- **Same account**, same data, everywhere

</td>
</tr>
</table>

---

## 📸 Screenshots

### Desktop App — Quick Panel

```
╭────────────────────────────────────────────╮
│ 🔍 Search clips...                        │
├────────────────────────────────────────────┤
│                                            │
│  📋 "Hallo Max, kannst du mir die..."     │
│     email · max · rechnung · freundlich    │
│     💡 Reply suggestions available         │
│     vor 5 Min · Outlook                    │
│                                            │
│  🔗 https://github.com/ghostclip          │
│     github · repo · open-source            │
│     vor 12 Min · Chrome                    │
│                                            │
│  💻 SELECT * FROM users WHERE...           │
│     sql · query · datenbank                │
│     vor 1h · VS Code                       │
│                                            │
│  🧾 [Screenshot] Vodafone 47.99€          │
│     rechnung · vodafone · OCR              │
│     vor 2h · Firefox                       │
│                                            │
├────────────────────────────────────────────┤
│  ↑↓ navigate · Enter paste · Tab details   │
╰────────────────────────────────────────────╯
```

### Desktop App — Main Window

```
╭──────────┬─────────────────────────────────────────────────╮
│          │                                                  │
│ 📋 Alle  │  Alle Clips                                     │
│ 📌 Pinned│  ┌────────────────────────────────────────────┐  │
│ 🏷 Tags  │  │ 🔍 Clips durchsuchen...          [✨ AI]  │  │
│ 📁 Samml.│  └────────────────────────────────────────────┘  │
│ ✨ Smart │                                                  │
│ 🕐 Heute │  ┌──────────────────┐ ┌──────────────────┐     │
│ 📅 Woche │  │ "Hallo Max..."   │ │ [Screenshot]     │     │
│ 🗄 Archiv│  │ 📧 email · max   │ │ 🧾 vodafone 47€  │     │
│          │  │ 💡 3 replies     │ │ 📝 OCR erkannt   │     │
│ ──────── │  │ vor 5m · Outlook │ │ vor 12m · Firefox│     │
│ 📊 Stats │  └──────────────────┘ └──────────────────┘     │
│ 💻 Geräte│                                                  │
│ ⚙ Settings│ ┌──────────────────┐ ┌──────────────────┐     │
│ 👤 Account│ │ SELECT * FROM... │ │ https://github...│     │
│          │  │ 💻 sql · query   │ │ 🔗 github · repo │     │
│          │  │ vor 1h · VS Code │ │ vor 2h · Chrome  │     │
│          │  └──────────────────┘ └──────────────────┘     │
╰──────────┴─────────────────────────────────────────────────╯
```

### Web Dashboard — AI Chat

```
╭─────────────────────────────────────────────────────────╮
│  ✨ AI Chat                                              │
│                                                          │
│         ┌──────────────────────────────────────┐        │
│         │ Was hat Max letzte Woche geschrieben? │        │
│         └──────────────────────────────────────┘        │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Max hat dir 3 Nachrichten geschickt:              │   │
│  │                                                    │   │
│  │ 1. 📧 Budget-Anfrage (Montag)                     │   │
│  │    "Kannst du mir die Rechnung schicken?"         │   │
│  │                                                    │   │
│  │ 2. 🔗 GitHub Link (Mittwoch)                      │   │
│  │    Shared ein Repo zum Review                     │   │
│  │                                                    │   │
│  │ 3. 📋 Meeting-Notizen (Freitag)                   │   │
│  │    Q2 Planung Zusammenfassung                     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────┐ [➤]  │
│  │ Frag mich was über deine Clips...             │      │
│  └──────────────────────────────────────────────┘      │
╰─────────────────────────────────────────────────────────╯
```

### Analytics Dashboard

```
╭─────────────────────────────────────────────────────────╮
│  📊 Analytics                                            │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   400    │ │    42    │ │    89    │ │    12    │  │
│  │ Clips/Wo │ │  Bilder  │ │   Code   │ │ Gepinnt  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                          │
│  Aktivität          ┌─┐     Clip-Typen                  │
│            ┌─┐      │ │                                  │
│       ┌─┐  │ │ ┌─┐  │ │       ╭───────╮                │
│  ┌─┐  │ │  │ │ │ │  │ │      ╱ Text    ╲               │
│  │ │  │ │  │ │ │ │  │ │ ┌─┐ │  52%     │               │
│  │ │  │ │  │ │ │ │  │ │ │ │ │ URLs 15% │               │
│  │ │  │ │  │ │ │ │  │ │ │ │  ╲ Code 20%╱               │
│  Mo Di Mi Do Fr Sa So      ╰───────╯                │
│                                                          │
│  Top Tags                                                │
│  ┌────────┐ ┌──────┐ ┌──────────┐ ┌────────┐ ┌──────┐ │
│  │email 67│ │code43│ │rechnung28│ │github24│ │meet15│ │
│  └────────┘ └──────┘ └──────────┘ └────────┘ └──────┘ │
╰─────────────────────────────────────────────────────────╯
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 22
- **pnpm** ≥ 9
- **Docker** (for PostgreSQL, Redis, MinIO)

### 1. Clone & Install

```bash
git clone https://github.com/lennystepn-hue/ghostclip.git
cd ghostclip
pnpm install
```

### 2. Start Infrastructure

```bash
docker compose -f docker/docker-compose.yml up -d
```

This starts PostgreSQL (with pgvector), Redis, and MinIO.

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys:
#   ANTHROPIC_API_KEY=sk-ant-...
#   OPENAI_API_KEY=sk-...
```

### 4. Run

```bash
# All apps in parallel
pnpm dev

# Or individually
pnpm dev --filter=@ghostclip/server    # API on :4000
pnpm dev --filter=@ghostclip/web       # Dashboard on :3000
pnpm dev --filter=@ghostclip/desktop   # Electron app
```

### 5. Run Tests

```bash
pnpm turbo test
```

---

## 🏗 Architecture

```
                    ┌─────────────────────────────────────────┐
                    │              Client Layer                │
                    │                                         │
                    │  ┌───────────┐  ┌──────────┐  ┌─────┐ │
                    │  │  Electron  │  │  Next.js  │  │ PWA │ │
                    │  │  Desktop   │  │  Web App  │  │     │ │
                    │  └─────┬─────┘  └─────┬─────┘  └──┬──┘ │
                    └────────┼──────────────┼───────────┼────┘
                             │   REST + WebSocket (wss)  │
                    ┌────────┼──────────────┼───────────┼────┐
                    │        ▼              ▼           ▼    │
                    │           Server (Express + Socket.io)  │
                    │                                         │
                    │  ┌──────┐ ┌─────────┐ ┌────┐ ┌──────┐ │
                    │  │ Auth │ │Clipboard│ │ AI │ │ Sync │ │
                    │  └──────┘ └─────────┘ └────┘ └──────┘ │
                    │                                         │
                    │  ┌──────────────────────────────────┐  │
                    │  │  PostgreSQL + pgvector │ Redis │ S3 │  │
                    │  └──────────────────────────────────┘  │
                    └─────────────────────────────────────────┘
```

### Monorepo Structure

```
ghostclip/
├── apps/
│   ├── server/          # Express API + Socket.io (TypeScript)
│   ├── web/             # Next.js 15 Web Dashboard
│   └── desktop/         # Electron + Vite + React
│
├── packages/
│   ├── shared/          # Types, constants, Zod validators
│   ├── crypto/          # AES-256-GCM encryption, PBKDF2
│   ├── ai-client/       # Claude API wrapper (enrich, reply, chat, vision)
│   └── ui/              # 10 shared React components + design system
│
├── docker/              # Docker Compose (dev + prod), nginx
└── .github/workflows/   # CI (lint + test) + Release (all platforms)
```

### Encryption Flow

```
User copies text
       │
       ▼
  ┌──────────┐     ┌───────────┐
  │ Plaintext │────▶│ Claude API │──▶ tags, summary, mood
  │  (RAM)    │     └───────────┘    (server-side searchable)
  │           │
  │           │──▶ AES-256-GCM ──▶ encrypted blob
  └──────────┘         │              (E2E, server can't read)
                       ▼
              ┌─────────────────┐
              │   Server stores  │
              │  encrypted blob  │
              │  + AI metadata   │
              └─────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Monorepo** | Turborepo + pnpm | Fast builds, shared packages |
| **Server** | Express + Socket.io | Proven, WebSocket support |
| **Database** | PostgreSQL 16 + pgvector | SQL + vector search in one |
| **Cache** | Redis 7 | Sessions, rate limiting, pub/sub |
| **Storage** | S3 / MinIO | Encrypted image/file storage |
| **Web** | Next.js 15 (App Router) | SSR, shared React components |
| **Desktop** | Electron + Vite | Cross-platform, fast dev |
| **UI** | React 19 + Tailwind + Framer Motion | Glassmorphism design system |
| **Encryption** | AES-256-GCM + PBKDF2 | Military-grade, zero-knowledge |
| **AI** | Claude API (Anthropic) | Best-in-class reasoning |
| **OCR/Vision** | Claude Vision | Image understanding + text extraction |
| **Embeddings** | OpenAI text-embedding-3-small | Semantic search vectors |
| **CI/CD** | GitHub Actions | Lint, test, build, release |

---

## 💰 Pricing

| | Free | Pro | Team |
|---|:---:|:---:|:---:|
| **Price** | €0/mo | €6/mo | €12/user/mo |
| Clips | 1,000 | Unlimited | Unlimited |
| Devices | 1 | 10 | Unlimited |
| AI Classification | 100/day | 1,000/hr | 1,000/hr |
| Cloud Sync | — | ✅ | ✅ |
| Reply Suggestions | — | ✅ | ✅ |
| Screen Context | — | ✅ | ✅ |
| Web Dashboard | — | ✅ | ✅ |
| AI Chat | — | ✅ | ✅ |
| Semantic Search | — | ✅ | ✅ |
| Analytics | — | ✅ | ✅ |
| Shared Collections | — | — | ✅ |
| SSO/SAML | — | — | ✅ |
| Audit Log | — | — | ✅ |

---

## 🚢 Deployment

### Production (Docker Compose)

```bash
# Configure
cp .env.example .env
# Set: DB_PASSWORD, REDIS_PASSWORD, JWT_SECRET, ANTHROPIC_API_KEY, etc.

# Deploy
docker compose -f docker/docker-compose.prod.yml up -d --build
```

**Production stack includes:**
- PostgreSQL 16 (pgvector) with persistent volumes
- Redis 7 with password auth
- MinIO for S3-compatible storage
- Express API server
- Next.js web app
- Nginx reverse proxy with SSL + rate limiting

### SSL Certificates

```bash
certbot certonly --standalone \
  -d ghostclip.com \
  -d app.ghostclip.com \
  -d api.ghostclip.com
```

---

## 🤝 Contributing

Contributions are welcome! GhostClip is open source and we love PRs.

```bash
# Fork, clone, install
git clone https://github.com/YOUR_USER/ghostclip.git
cd ghostclip && pnpm install

# Create feature branch
git checkout -b feat/my-feature

# Make changes, add tests
pnpm turbo test

# Full check
pnpm turbo lint test build

# Commit & PR
git commit -m "feat: add my feature"
git push origin feat/my-feature
```

### Guidelines

- TypeScript strict mode everywhere
- Follow existing patterns (check similar modules)
- Write tests for new features
- Conventional commits (`feat:`, `fix:`, `chore:`)
- Keep PRs focused — one feature per PR

---

## 🔑 Keyboard Shortcuts (Desktop)

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+V` | Open Quick Panel |
| `Ctrl+Shift+F` | Semantic Search |
| `Ctrl+Shift+R` | Reply Suggestions |
| `Ctrl+Shift+P` | Pin Last Clip |
| `Ctrl+Shift+S` | Toggle Screen Context |
| `Ctrl+Shift+1-9` | Quick-paste pinned clips |

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
<br/>

**Built with 🔐 by the GhostClip community**

*Your clipboard. Your data. Your AI.*

<br/>

<a href="https://ghostclip.com">Website</a> · <a href="https://github.com/lennystepn-hue/ghostclip/issues">Issues</a> · <a href="https://github.com/lennystepn-hue/ghostclip/discussions">Discussions</a>

</div>

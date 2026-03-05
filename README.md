<div align="center">

<br/>
<img width="120" src="docs/screenshots/icon.png" alt="GhostClip"/>
<br/><br/>

# GhostClip

### Your AI-Powered Clipboard Manager

**Copy anything. GhostClip remembers it, understands it, and syncs it everywhere.**

<br/>

[![Version](https://img.shields.io/badge/version-0.1.0-5c7cfa?style=for-the-badge)](https://github.com/lennystepn-hue/ghostclip/releases)
&nbsp;&nbsp;
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
&nbsp;&nbsp;
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge)](LICENSE)

<br/>

**Linux** · **macOS** · **Windows** · **Web Dashboard**

<br/>

[Features](#-what-it-does) · [Screenshots](#-screenshots) · [Pricing](#-pricing) · [Download](#-download) · [Self-Hosting](#-self-hosting) · [Architecture](#-architecture) · [Contributing](#-contributing)

<br/>
</div>

---

<br/>

## The Problem

You copy things all day — links, code, messages, passwords, screenshots. They vanish after the next copy. You search your browser history, scroll through chats, dig through files — trying to find that one thing you had 20 minutes ago.

**GhostClip fixes this.**

It runs silently in your system tray, captures everything you copy, and makes it searchable, organized, and intelligent. Not just a clipboard history — an AI-powered knowledge layer on top of your daily workflow.

<br/>

---

<br/>

## What It Does

<table>
<tr>
<td width="50%" valign="top">

### AI Intelligence
Every clip gets analyzed automatically:

- **Auto-tagging** — AI generates relevant tags
- **Smart summaries** — one-line description of what you copied
- **Mood detection** — business, private, creative, urgent
- **Sensitivity flags** — detects passwords, tokens, personal data
- **Reply suggestions** — recognizes messages, generates 3 reply options
- **Vision & OCR** — analyzes images, reads text from screenshots
- **AI Chat** — "What did I copy about the meeting last week?"
- **Auto-learning** — adapts to your vocabulary and patterns

</td>
<td width="50%" valign="top">

### Clipboard Management
More than just history:

- **All content types** — text, URLs, images, code, files
- **URL content storage** — saves page title, description, full text
- **Full-text search** + semantic search (AI-powered)
- **Tags, Collections, Smart Filters**
- **Pin important clips**, archive old ones
- **Auto-expire** sensitive data (passwords, API keys)
- **Floating widget** — quick access without opening the app
- **Quick Panel** — keyboard shortcut for instant paste

</td>
</tr>
<tr>
<td width="50%" valign="top">

### Cross-Platform
Same app, everywhere:

- **Linux** — AppImage + .deb
- **macOS** — .dmg (Intel + Apple Silicon)
- **Windows** — .exe installer
- **Web Dashboard** — access from any browser
- **System tray** — always running, never in the way

</td>
<td width="50%" valign="top">

### Cloud Sync
Create an account directly in the app:

- **Real-time sync** via WebSocket (< 500ms)
- **Offline queue** — works without internet
- **Conflict resolution** across devices
- **Server-side AI** — no local API keys needed
- **E2E encryption** — server never sees your content

</td>
</tr>
</table>

<br/>

---

<br/>

## Screenshots

### Clip Feed — AI-Tagged Clips

Every clip is automatically enriched with tags, summaries, mood, and sensitivity detection. URLs show page titles and content. Images get OCR text extraction.

<div align="center">
<img src="docs/screenshots/desktop-clips.png" width="850" alt="GhostClip Desktop — Clip Feed with AI Tags"/>
</div>

<br/>

### Account — Cloud Sync Registration

Create an account directly in the app to enable cross-device sync. All AI features work immediately after registration — no API keys needed.

<div align="center">
<img src="docs/screenshots/desktop-account.png" width="850" alt="GhostClip Desktop — Account Registration"/>
</div>

<br/>

---

<br/>

## Pricing

<div align="center">

| | **Community** | **Pro** | **Team** |
|:---|:---:|:---:|:---:|
| | Self-hosted | Cloud | Cloud |
| **Price** | **Free** | **5 EUR / month** | **10 EUR / user / month** |
| | | | |
| Clipboard History | Unlimited | Unlimited | Unlimited |
| AI Tagging & Summaries | &#10003; (own API key) | &#10003; | &#10003; |
| Vision & OCR | &#10003; (own API key) | &#10003; | &#10003; |
| AI Chat | &#10003; (own API key) | &#10003; | &#10003; |
| Reply Suggestions | &#10003; (own API key) | &#10003; | &#10003; |
| Semantic Search | &#10003; | &#10003; | &#10003; |
| Local Storage (SQLite) | &#10003; | &#10003; | &#10003; |
| | | | |
| **Cloud Sync** | — | &#10003; | &#10003; |
| Devices | 1 | Up to 10 | Unlimited |
| Server-side AI (no API key needed) | — | &#10003; | &#10003; |
| Web Dashboard | — | &#10003; | &#10003; |
| Priority Support | — | &#10003; | &#10003; |
| Shared Collections | — | — | &#10003; |
| Team Analytics | — | — | &#10003; |
| SSO / SAML | — | — | &#10003; |

</div>

<br/>

> **Community** is 100% free and open source. Self-host everything, bring your own Anthropic API key, keep all data on your machine. No limits, no tracking, no account needed.
>
> **Pro** and **Team** use our managed cloud — we handle the server, the AI, and the sync. Create an account in the app, pay monthly, done.

<br/>

---

<br/>

## Download

Download the latest release for your platform from **[GitHub Releases](https://github.com/lennystepn-hue/ghostclip/releases)**.

| Platform | File |
|:---------|:-----|
| **Linux** (AppImage) | `GhostClip-0.1.0-x86_64.AppImage` |
| **Linux** (Debian/Ubuntu) | `GhostClip-0.1.0-amd64.deb` |
| **macOS** | `GhostClip-0.1.0-x64.dmg` |
| **Windows** | `GhostClip-0.1.0-x64.exe` |

> **Cloud users (Pro / Team):** Download the app, create an account, done — AI and sync work instantly.
>
> **Self-hosted (Community):** Download the app or [build from source](#-self-hosting). Bring your own API key.

<br/>

---

<br/>

## How the AI Works

GhostClip uses Claude (by Anthropic) for all AI features. There are two modes:

### Self-Hosted (Community)
Bring your own Anthropic API key (`ANTHROPIC_API_KEY`) or use [Claude CLI](https://docs.anthropic.com/en/docs/claude-cli) with a Max plan. GhostClip calls the API directly from your machine. No data leaves your device except to Anthropic.

### Cloud (Pro / Team)
When you create a GhostClip account, AI requests go through our server. We hold the API key — you don't need one. Your clips are sent to our server for AI enrichment, then the response comes back to your device. Clip content is encrypted in transit (TLS) and at rest (AES-256-GCM).

**Which model does what?**

| Task | Model | Why |
|------|-------|-----|
| **Enrichment** (tags, summary, mood) | Claude Haiku 4.5 | Fast, cheap — runs on every clip |
| **Chat & Replies** | Claude Sonnet 4.6 | Smart — needs conversation context |
| **Vision & OCR** | Claude Sonnet 4.6 | Image understanding + text extraction |

<br/>

---

<br/>

## Self-Hosting

The entire stack is open source. Run your own GhostClip server with full AI, sync, and dashboard.

### Prerequisites

- Node.js >= 22
- pnpm >= 9
- Docker (for PostgreSQL + Redis)
- Anthropic API key (for AI features)

### Setup

```bash
# 1. Clone
git clone https://github.com/lennystepn-hue/ghostclip.git
cd ghostclip && pnpm install

# 2. Start databases
docker compose up -d

# 3. Configure server
cp apps/server/.env.example apps/server/.env
# Set: JWT_SECRET, ANTHROPIC_API_KEY

# 4. Initialize database
cd apps/server && pnpm db:init

# 5. Start everything
cd apps/server && pnpm dev      # API on :4000
cd apps/web && pnpm dev          # Web on :3000
cd apps/desktop && pnpm dev      # Desktop app
```

### Build Installers

```bash
cd apps/desktop && pnpm build

# Pick your platform
npx electron-builder --linux AppImage deb
npx electron-builder --mac dmg
npx electron-builder --win nsis
```

Output goes to `apps/desktop/release/`.

### Production Deployment

Put the server behind nginx or Caddy with SSL:

```bash
certbot --nginx -d api.your-domain.com
```

Point the desktop app to your server via the "Eigenen Server verwenden" option during login.

<br/>

---

<br/>

## Architecture

```
ghostclip/
├── apps/
│   ├── server/          # Express + Socket.io — Auth, Sync, AI proxy
│   ├── web/             # Next.js 15 — Landing page + Web Dashboard
│   └── desktop/         # Electron + Vite + React — Desktop app
│
├── packages/
│   ├── shared/          # Types, Zod validators, constants
│   ├── crypto/          # AES-256-GCM encryption, PBKDF2
│   ├── ai-client/       # Claude API wrapper (enrich, reply, chat, vision)
│   └── ui/              # Shared React components + Tailwind design system
│
├── docker/              # Docker Compose for dev infrastructure
└── .github/workflows/   # CI + multi-platform release builds
```

### Data Flow

```
  You copy something
        │
        ▼
  Clipboard Watcher (polls every 500ms)
        │
        ├─ Detect type (text / URL / image / code)
        ├─ Store in local SQLite (WAL mode)
        ├─ Fetch URL content (title, text, description)
        │
        ▼
  AI Enrichment (async, background)
        │
        ├─ Tags, summary, mood, sensitivity
        ├─ OCR for images
        ├─ Reply suggestions for messages
        ├─ Embedding for semantic search
        │
        ▼
  Sync to cloud (if logged in, via WebSocket)
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Desktop** | Electron 33, Vite, React 19, better-sqlite3 |
| **Web** | Next.js 15 (App Router), Tailwind CSS |
| **Server** | Express, Socket.io, PostgreSQL 16 + pgvector, Redis 7 |
| **AI** | Claude API (Haiku 4.5 + Sonnet 4.6) |
| **Encryption** | AES-256-GCM, PBKDF2 (600k iterations) |
| **CI/CD** | GitHub Actions — lint, test, build for Linux/Mac/Windows |

<br/>

---

<br/>

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+V` | Open Quick Panel |
| `Ctrl+Shift+R` | Reply Suggestions |

<br/>

---

<br/>

## Contributing

PRs welcome. GhostClip is fully open source.

```bash
git clone https://github.com/YOUR_USER/ghostclip.git
cd ghostclip && pnpm install

git checkout -b feat/my-feature
# ... make changes ...
pnpm turbo test

git commit -m "feat: add my feature"
git push origin feat/my-feature
```

**Guidelines:** TypeScript strict mode. Conventional commits. One feature per PR.

<br/>

---

<br/>

## License

MIT — see [LICENSE](LICENSE) for details.

<br/>

---

<div align="center">
<br/>
<img width="40" src="docs/screenshots/icon.png" alt=""/>
<br/><br/>

**Built by [Lenny Enderle](https://github.com/lennystepn-hue)**

*Your clipboard. Your data. Your AI.*

<br/><br/>
</div>

<div align="center">

<br/>
<img width="120" src="docs/screenshots/icon.png" alt="GhostClip"/>
<br/><br/>

# GhostClip

### Your AI-Powered Clipboard Manager

**Copy anything. GhostClip remembers it, understands it, and makes it searchable.**

<br/>

[![Version](https://img.shields.io/badge/version-0.2.0-5c7cfa?style=for-the-badge)](https://github.com/lennystepn-hue/ghostclip/releases)
&nbsp;&nbsp;
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
&nbsp;&nbsp;
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge)](LICENSE)

<br/>

**Linux** · **macOS** · **Windows**

<br/>

[Features](#-what-it-does) · [Quick Start](#-quick-start) · [Screenshots](#-screenshots) · [Download](#-download) · [Self-Hosting](#-self-hosting) · [Architecture](#-architecture) · [Contributing](#-contributing)

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

## Quick Start

```
1. Download GhostClip for your platform
2. Open the app
3. Go to Account → Click "Connect Claude"
4. Login with your Anthropic account in the browser
5. Done — AI features are active
```

That's it. No API keys, no server, no account needed. You use your own Claude token. All data stays on your machine.

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
- **System tray** — always running, never in the way

</td>
<td width="50%" valign="top">

### Cloud Sync (optional)
Create an account in the app for multi-device sync:

- **Real-time sync** via WebSocket (< 500ms)
- **Offline queue** — works without internet
- **Conflict resolution** across devices
- **E2E encryption** — server never sees your content
- **Self-hostable** — run your own sync server

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

---

<br/>

## How the AI Works

GhostClip uses Claude (by Anthropic) for all AI features. Click **"Connect Claude"** in the app — it opens your browser, you log in with your Anthropic account, and you're done. Your own token, your own usage.

**No API key needed.** GhostClip uses Claude OAuth, the same auth flow as Claude.ai. Works with any Anthropic plan.

| Task | Model | Why |
|------|-------|-----|
| **Enrichment** (tags, summary, mood) | Claude Haiku 4.5 | Fast — runs on every clip |
| **Chat & Replies** | Claude Sonnet 4.6 | Smart — needs conversation context |
| **Vision & OCR** | Claude Sonnet 4.6 | Image understanding + text extraction |

> **Alternative:** You can also set `ANTHROPIC_API_KEY` in the environment if you prefer using an API key directly.

<br/>

---

<br/>

## Download

Download the latest release for your platform from **[GitHub Releases](https://github.com/lennystepn-hue/ghostclip/releases)**.

| Platform | File |
|:---------|:-----|
| **Linux** (AppImage) | `GhostClip-0.2.0-x86_64.AppImage` |
| **Linux** (Debian/Ubuntu) | `GhostClip-0.2.0-amd64.deb` |
| **macOS** | `GhostClip-0.2.0-x64.dmg` |
| **Windows** | `GhostClip-0.2.0-x64.exe` |

<details>
<summary><strong>macOS: "App is damaged" fix</strong></summary>

macOS blocks unsigned apps by default. After downloading, run:

```bash
xattr -cr /Applications/GhostClip.app
```

Or right-click the app → Open → Open anyway.

</details>

<br/>

---

<br/>

## Self-Hosting

The entire stack is open source. You can also self-host the sync server for multi-device sync.

### Prerequisites

- Node.js >= 22
- pnpm >= 9
- Docker (for PostgreSQL + Redis)

### Desktop Only (no server needed)

```bash
# 1. Clone & install
git clone https://github.com/lennystepn-hue/ghostclip.git
cd ghostclip && pnpm install

# 2. Run the desktop app
cd apps/desktop && pnpm dev
```

Connect Claude via the button in the app. Everything works locally.

### With Sync Server

```bash
# 1. Start databases
docker compose up -d

# 2. Configure server
cp apps/server/.env.example apps/server/.env
# Set: JWT_SECRET

# 3. Initialize database
cd apps/server && pnpm db:init

# 4. Start everything
cd apps/server && pnpm dev      # API on :4000
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

<br/>

---

<br/>

## Architecture

```
ghostclip/
├── apps/
│   ├── server/          # Express + Socket.io — Auth, Sync
│   ├── web/             # Next.js 15 — Landing page
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
  AI Enrichment (via your Claude token)
        │
        ├─ Tags, summary, mood, sensitivity
        ├─ OCR for images
        ├─ Reply suggestions for messages
        ├─ Embedding for semantic search
        │
        ▼
  Sync to server (optional, if logged in)
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Desktop** | Electron 33, Vite, React 19, better-sqlite3 |
| **Server** | Express, Socket.io, PostgreSQL 16 + pgvector, Redis 7 |
| **AI** | Claude API (Haiku 4.5 + Sonnet 4.6) via OAuth |
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

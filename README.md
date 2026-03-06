<div align="center">

<br/>
<img width="120" src="docs/screenshots/icon.png" alt="GhostClip"/>
<br/><br/>

# GhostClip

### Your AI-Powered Clipboard Manager

**Copy anything. GhostClip remembers it, understands it, and makes it useful.**

<br/>

[![Version](https://img.shields.io/badge/version-0.5.1-5c7cfa?style=for-the-badge)](https://github.com/lennystepn-hue/ghostclip/releases)
&nbsp;&nbsp;
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
&nbsp;&nbsp;
[![Electron](https://img.shields.io/badge/Electron-33-47848f?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
&nbsp;&nbsp;
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge)](LICENSE)

<br/>

**Linux** &middot; **macOS** &middot; **Windows**

<br/>

[Features](#-features) &middot; [Quick Start](#-quick-start) &middot; [AI Features](#-ai-features) &middot; [Download](#-download) &middot; [Self-Hosting](#-self-hosting) &middot; [Architecture](#-architecture) &middot; [Contributing](#-contributing)

<br/>
</div>

---

## The Problem

You copy things all day -- links, code, messages, passwords, screenshots. They vanish after the next copy. You search your browser history, scroll through chats, dig through files -- trying to find that one thing you had 20 minutes ago.

**GhostClip fixes this.**

It runs silently in your system tray, captures everything you copy, and makes it searchable, organized, and intelligent. Not just a clipboard history -- an AI-powered knowledge layer on top of your daily workflow.

---

## Features

<table>
<tr>
<td width="50%" valign="top">

### AI Intelligence
Every clip gets analyzed automatically:

- **Auto-tagging** -- AI generates relevant tags, learns your vocabulary
- **Smart summaries** -- one-line description of what you copied
- **Mood detection** -- business, private, creative, urgent
- **Sensitivity flags** -- detects passwords, tokens, personal data
- **Reply suggestions** -- recognizes messages, generates 3 reply options in different tones
- **Vision & OCR** -- analyzes images, reads text from screenshots
- **AI Chat** -- "What did I copy about the meeting last week?"
- **AI Transform** -- rewrite text shorter/formal/casual, translate EN/DE, fix grammar, summarize, explain
- **Similar Clips** -- find semantically related clips via AI embeddings
- **Auto-learning** -- adapts tags, tone, and suggestions to your patterns over time

</td>
<td width="50%" valign="top">

### Clipboard Management
More than just history:

- **All content types** -- text, URLs, images, code, files
- **URL enrichment** -- saves page title, description, and full text content
- **Full-text search** + semantic search (AI-powered, finds by meaning not just keywords)
- **Filter chips** -- All, Today, This Week, Pinned, Archive in one view
- **Tags, Collections, Smart Collections** (rule-based auto-filters)
- **Pin important clips**, archive old ones
- **Auto-expire** sensitive data (passwords, API keys delete themselves)
- **Clipboard Templates** -- save reusable text with `{variables}`
- **Clipboard Rules** -- auto-tag or auto-mark clips based on content patterns
- **Source App tracking** -- see which app you copied from
- **Floating widget** -- quick access without opening the app
- **Quick Panel** (`Ctrl+Shift+V`) -- keyboard-driven instant paste

</td>
</tr>
<tr>
<td width="50%" valign="top">

### Cross-Platform
Same app, everywhere:

- **Linux** -- AppImage + .deb
- **macOS** -- .dmg (Intel + Apple Silicon), code-signed
- **Windows** -- .exe installer
- **System tray** -- always running, never in the way
- **Auto-updates** -- checks for new versions automatically
- **Frameless window** -- custom title bar, native feel

</td>
<td width="50%" valign="top">

### Cloud Sync (optional)
Create a free account in the app for multi-device sync:

- **Real-time sync** via WebSocket (< 500ms)
- **Offline queue** -- works without internet, syncs when back online
- **Conflict resolution** -- timestamp + enrichment-based merging
- **E2E encryption** -- AES-256-GCM, server never sees your content
- **Device management** -- see all connected devices, platform, last sync
- **Self-hostable** -- run your own sync server

</td>
</tr>
</table>

---

## Quick Start

### Option 1: Claude CLI (zero config, recommended)

```
1. Download GhostClip from Releases -> open the app
2. That's it -- AI works automatically
```

GhostClip detects your Claude CLI login and uses it. If you're already logged into [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview) or Claude CLI, **AI features are active immediately** -- no setup needed.

### Option 2: API Key

```
1. Download GhostClip -> open the app
2. Go to Account -> API Key -> paste your key from console.anthropic.com
3. Done -- AI features are active
```

### Option 3: Without AI

GhostClip works perfectly fine without AI too -- clipboard history, search, pin, collections, sync all work. AI enrichment (tags, summaries, vision) just won't be available.

> **All data stays on your machine.** You use your own Claude token -- GhostClip never sees your credentials. No telemetry, no tracking, no cloud dependency.

---

## AI Features

### Auto-Enrichment

Every time you copy something, GhostClip's AI analyzes it in the background:

```
You copy: "Meeting mit dem Team um 14 Uhr wegen Sprint-Planung"

GhostClip adds:
  Tags:     meeting, sprint, team, planung
  Summary:  Team-Meeting um 14 Uhr fuer Sprint-Planung
  Mood:     geschaeftlich
  Sensitivity: low
```

For URLs, GhostClip fetches the page content first, then enriches with the full context:

```
You copy: "https://github.com/anthropics/claude-code"

GhostClip fetches the page, then adds:
  Tags:     github, anthropic, claude, cli, development
  Summary:  Claude Code - Anthropic's official CLI for Claude
  Content:  [full page title + description + text stored for search]
```

### Vision & OCR

Copy a screenshot or image -- GhostClip analyzes it with Claude Vision:

```
You copy: [screenshot of error message]

GhostClip adds:
  Summary:  TypeScript Compilation Error - Property 'x' does not exist on type 'Y'
  OCR:      "error TS2339: Property 'x' does not exist on type 'Y'..."
  Tags:     error, typescript, compilation, bug
```

### AI Transform

Click on any text clip to expand it, then use the transform buttons:

| Button | What it does |
|--------|-------------|
| **Kuerzer** | Shortens the text to its essence |
| **Formell** | Rewrites in professional tone |
| **Locker** | Rewrites in casual, friendly tone |
| **EN** | Translates to English |
| **DE** | Translates to German |
| **Korrektur** | Fixes grammar and spelling |
| **Zusammenfassen** | Summarizes in 2-3 sentences |
| **Erklaeren** | Explains the text/code simply |

### AI Chat

Ask questions about your entire clipboard history:

- "Was habe ich heute alles kopiert?"
- "Finde alle Links die ich letzte Woche kopiert habe"
- "Was war der Code-Snippet mit dem API-Fehler?"
- "Fasse meine kopierten Notizen vom Meeting zusammen"

The chat uses semantic search to find relevant clips across your entire history, not just recent ones.

### Reply Suggestions

When you copy a message (email, chat, etc.), GhostClip detects it and generates 3 reply suggestions in different tones (casual, formal, friendly). Click one to copy it to your clipboard.

### Similar Clips

In the expanded clip view, click "Aehnliche Clips finden" to discover semantically related clips. Uses OpenAI embeddings to find clips about the same topic, even if they use different words.

### Auto-Learning

GhostClip learns from your usage:
- **Consistent tags** -- uses the same tag names for the same topics
- **Source app awareness** -- knows you often copy code from VS Code, messages from Slack
- **Reply style** -- learns your writing tone from past replies
- **User profile** -- builds a profile of your top topics, apps, and patterns

---

## Which AI Models?

| Task | Model | Speed | Why |
|------|-------|-------|-----|
| **Enrichment** (tags, summary, mood) | Claude Haiku 4.5 | ~1s | Fast -- runs on every single clip |
| **AI Transform** (rewrite, translate) | Claude Haiku 4.5 | ~1s | Fast -- interactive, needs quick response |
| **Chat** | Claude Sonnet 4.6 | ~3s | Smart -- needs conversation context |
| **Reply Suggestions** | Claude Sonnet 4.6 | ~2s | Smart -- needs tone awareness |
| **Vision & OCR** | Claude Sonnet 4.6 | ~3s | Capable -- image understanding + text extraction |
| **Semantic Search** | OpenAI text-embedding-3-small | ~0.5s | Optional -- only if OpenAI key is set |

---

## Download

Download the latest release for your platform from **[GitHub Releases](https://github.com/lennystepn-hue/ghostclip/releases)**.

| Platform | File | Notes |
|:---------|:-----|:------|
| **Linux** (AppImage) | `GhostClip-x86_64.AppImage` | Works on all distros |
| **Linux** (Debian/Ubuntu) | `GhostClip-amd64.deb` | `sudo dpkg -i` |
| **macOS** (Apple Silicon) | `GhostClip-arm64.dmg` | Code-signed |
| **macOS** (Intel) | `GhostClip-x64.dmg` | Code-signed |
| **Windows** | `GhostClip-x64.exe` | Installer |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+V` | Open Quick Panel (instant clip search & paste) |
| `Ctrl+Shift+R` | Reply Suggestions for last copied message |
| `Ctrl+Shift+F` | Focus search in clip feed |
| `Ctrl+Shift+P` | Pin/unpin current clip |
| `Ctrl+Shift+S` | Toggle floating widget |

---

## Self-Hosting

The entire stack is open source. Run everything locally or host your own sync server.

### Prerequisites

- Node.js >= 22
- pnpm >= 9
- Docker (only for sync server -- PostgreSQL + Redis)

### Desktop Only (no server needed)

```bash
# Clone & install
git clone https://github.com/lennystepn-hue/ghostclip.git
cd ghostclip && pnpm install

# Run the desktop app in development
cd apps/desktop && pnpm dev
```

Connect Claude via the Account page in the app. Everything runs locally.

### With Sync Server

```bash
# 1. Start databases
docker compose up -d   # PostgreSQL 16 + Redis 7

# 2. Configure server
cp apps/server/.env.example apps/server/.env
# Edit .env: set JWT_SECRET, DATABASE_URL, REDIS_URL

# 3. Initialize database
cd apps/server && pnpm db:init

# 4. Start everything
pnpm dev   # Starts all apps via Turborepo
```

### Build Installers

```bash
# Build all packages first
pnpm build

# Then build platform-specific installers
cd apps/desktop
npx electron-builder --linux AppImage deb
npx electron-builder --mac dmg
npx electron-builder --win nsis
```

Output goes to `apps/desktop/release/`.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes (server) | -- | Secret for JWT token signing |
| `DATABASE_URL` | Yes (server) | -- | PostgreSQL connection string |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis for rate limiting |
| `ANTHROPIC_API_KEY` | No | -- | Alternative to Claude CLI auth |
| `PORT` | No | `4000` | Server port |

---

## Architecture

```
ghostclip/
+-- apps/
|   +-- desktop/         # Electron 33 + Vite + React 19
|   |   +-- src/main/    # Main process: clipboard watcher, AI, DB, sync
|   |   +-- src/renderer/ # UI: ClipFeed, Chat, Tags, Collections, Settings
|   |   +-- src/preload/  # IPC bridge (50+ methods)
|   |
|   +-- server/          # Express + Socket.io + PostgreSQL
|   |   +-- src/modules/ # Auth, Sync, AI proxy
|   |
|   +-- web/             # Next.js 15 -- Landing page + Web Dashboard
|
+-- packages/
|   +-- shared/          # TypeScript types, Zod validators, constants
|   +-- crypto/          # AES-256-GCM encryption, PBKDF2 key derivation
|   +-- ai-client/       # Claude API: enrich, reply, chat, vision, transform
|   +-- ui/              # Shared React components + Tailwind design system
|
+-- docker/              # Docker Compose for PostgreSQL + Redis
+-- .github/workflows/   # CI: lint, test, multi-platform release builds
```

### Data Flow

```
  You copy something
        |
        v
  Clipboard Watcher (polls every 500ms)
        |
        +-- Detect type (text / URL / image / code)
        +-- Detect source app (xdotool on Linux)
        +-- Check dedup (content hash)
        +-- Store in local SQLite (WAL mode)
        +-- Fetch URL content if URL (title, text, description)
        |
        v
  AI Enrichment (async, via your Claude token)
        |
        +-- Tags, summary, mood, sensitivity (Haiku 4.5)
        +-- OCR + description for images (Sonnet 4.6)
        +-- Generate embedding for semantic search (OpenAI)
        +-- Check for message -> auto-generate reply suggestions
        +-- Apply clipboard rules (auto-tag, auto-mark)
        |
        v
  Sync to Cloud (optional, if logged in)
        |
        +-- E2E encrypt content (AES-256-GCM)
        +-- Emit via Socket.io to server
        +-- Server relays to other devices
        +-- Conflict resolution (timestamp + enrichment merge)
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Desktop** | Electron 33, Vite 6, React 19, better-sqlite3, Tailwind CSS 4 |
| **Server** | Express 5, Socket.io 4, PostgreSQL 16, Redis 7 |
| **AI** | Claude API (Haiku 4.5 + Sonnet 4.6) via OAuth or API Key |
| **Search** | OpenAI text-embedding-3-small for semantic vector search |
| **Encryption** | AES-256-GCM, PBKDF2 (600k iterations), per-user keys |
| **CI/CD** | GitHub Actions -- lint, test, build for Linux/Mac/Windows |
| **Monorepo** | Turborepo, pnpm workspaces |

### Security

- **Local-first** -- all data stored in SQLite on your machine
- **Your AI token** -- GhostClip uses your own Claude credentials, never stores or proxies them through third parties
- **E2E encryption** -- sync data is encrypted before leaving your device
- **Auto-expire** -- sensitive clips (passwords, tokens) are automatically deleted after 5 minutes
- **No telemetry** -- no analytics, no tracking, no phoning home

---

## Web Dashboard

GhostClip includes a web dashboard (Next.js) for accessing your clips from any browser. Available at `https://app.ghost-clip.com` or self-hosted.

Features:
- View and search all synced clips
- AI Chat interface
- Analytics and statistics
- Device management
- Account settings

---

## Contributing

PRs welcome! GhostClip is fully open source under the MIT license.

```bash
# Fork & clone
git clone https://github.com/YOUR_USER/ghostclip.git
cd ghostclip && pnpm install

# Create feature branch
git checkout -b feat/my-feature

# Make changes, then test
pnpm turbo test

# Commit & push
git commit -m "feat: add my feature"
git push origin feat/my-feature
```

**Guidelines:**
- TypeScript strict mode
- Conventional commits (`feat:`, `fix:`, `chore:`)
- One feature per PR
- Test new features

---

## License

MIT -- see [LICENSE](LICENSE) for details.

---

<div align="center">
<br/>
<img width="40" src="docs/screenshots/icon.png" alt=""/>
<br/><br/>

**Built by [Lenny Enderle](https://github.com/lennystepn-hue)**

*Your clipboard. Your data. Your AI.*

<br/><br/>
</div>

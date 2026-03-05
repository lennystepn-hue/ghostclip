<p align="center">
  <img src="docs/logo-placeholder.png" alt="GhostClip Logo" width="120" />
</p>

<h1 align="center">GhostClip</h1>

<p align="center">
  <strong>Your clipboard, everywhere. End-to-end encrypted clipboard sync across all your devices.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> &middot;
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#architecture">Architecture</a> &middot;
  <a href="#deployment">Deployment</a> &middot;
  <a href="#contributing">Contributing</a>
</p>

---

## What is GhostClip?

GhostClip is a real-time, end-to-end encrypted clipboard manager that syncs your clips across desktop and web. Every piece of content is encrypted on your device before it ever leaves -- not even the server can read your data. AI-powered search and smart categorization help you find anything you have ever copied.

## Features

- **End-to-End Encryption** -- All clipboard data is encrypted client-side using AES-256-GCM. The server never sees plaintext content.
- **Real-Time Sync** -- Clips appear instantly across all connected devices via WebSocket.
- **AI-Powered Search** -- Natural language search over your encrypted clips using local decryption + server-side vector embeddings.
- **Smart Categories** -- Automatic detection of URLs, code snippets, emails, addresses, and more.
- **Desktop App** -- Native Electron app with global hotkey, system tray, and clipboard monitoring.
- **Web Dashboard** -- Full-featured Next.js web interface for browsing, searching, and managing clips.
- **Secure Sharing** -- Share individual clips or collections with expiring, encrypted links.
- **Offline Support** -- Local SQLite cache keeps your clips available even without a connection.
- **Cross-Platform** -- Works on macOS, Windows, and Linux.

## Screenshots

<p align="center">
  <em>Screenshots coming soon</em>
</p>

## Quick Start

### Prerequisites

- **Node.js** >= 22
- **pnpm** >= 9
- **PostgreSQL** 16+ (with pgvector extension)
- **Redis** 7+

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/ghostclip.git
cd ghostclip

# Install dependencies
pnpm install

# Set up environment variables
cp apps/server/.env.example apps/server/.env
# Edit .env with your database credentials, JWT secrets, etc.

# Start all services in dev mode
pnpm dev

# Or start individual apps
pnpm dev --filter=@ghostclip/server   # API server on :4000
pnpm dev --filter=@ghostclip/web      # Web app on :3000
pnpm dev --filter=@ghostclip/desktop  # Electron app
```

### Docker (Development)

```bash
# Start infrastructure (Postgres, Redis, MinIO)
docker compose -f docker/docker-compose.yml up -d

# Run the app
pnpm dev
```

## Architecture

```
ghostclip/
├── apps/
│   ├── server/          # Hono API server (Node.js)
│   ├── web/             # Next.js 15 web dashboard
│   └── desktop/         # Electron desktop app
├── packages/
│   ├── shared/          # Shared types, schemas, constants
│   ├── crypto/          # E2E encryption library (AES-256-GCM)
│   ├── ai-client/       # AI provider abstraction (Anthropic, OpenAI)
│   └── ui/              # Shared React component library
├── docker/              # Production Docker configs
└── .github/workflows/   # CI/CD pipelines
```

### Data Flow

```
Clipboard Copy
    |
    v
Desktop App (encrypts locally)
    |
    v
WebSocket --> Server (stores encrypted blob) --> PostgreSQL + pgvector
    |
    v
All connected clients (decrypt locally)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Monorepo** | pnpm workspaces + Turborepo |
| **Server** | Node.js, Hono, Drizzle ORM |
| **Database** | PostgreSQL 16 + pgvector |
| **Cache** | Redis 7 |
| **Web** | Next.js 15, React, Tailwind CSS |
| **Desktop** | Electron, Vite |
| **Encryption** | AES-256-GCM (Web Crypto API) |
| **AI** | Anthropic Claude, OpenAI (pluggable) |
| **Storage** | S3-compatible (MinIO / AWS S3) |
| **CI/CD** | GitHub Actions |

## Deployment

### Production (Docker Compose)

```bash
# Configure environment
cp .env.example .env
# Edit .env with production values

# Deploy
docker compose -f docker/docker-compose.prod.yml up -d --build
```

The production stack includes:
- **PostgreSQL** (pgvector) for persistent storage
- **Redis** for caching and pub/sub
- **MinIO** for file/image storage
- **Nginx** reverse proxy with SSL termination and rate limiting
- **Server** and **Web** application containers

### SSL Certificates

The nginx config expects Let's Encrypt certificates. Set them up with:

```bash
certbot certonly --standalone -d ghostclip.com -d app.ghostclip.com -d api.ghostclip.com
```

## Contributing

Contributions are welcome! Here is how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes and add tests
4. Run the full check suite: `pnpm turbo lint test build`
5. Commit with a descriptive message
6. Open a pull request against `main`

### Code Style

- TypeScript strict mode everywhere
- ESLint + Prettier for formatting
- Conventional commits preferred

### Running Tests

```bash
# All tests
pnpm turbo test

# Specific package
pnpm turbo test --filter=@ghostclip/server
pnpm turbo test --filter=@ghostclip/crypto
```

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with care. Your data stays yours.
</p>

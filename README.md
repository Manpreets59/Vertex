<div align="center">
  <img src="public/logo.svg" alt="Vertex Logo" width="64" height="64" />
  <h1>Vertex</h1>
  <p>A cloud-based IDE with an integrated AI coding assistant powered by Google Gemini.</p>

  ![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
  ![Convex](https://img.shields.io/badge/Convex-1.4-orange?style=flat-square)
  ![Inngest](https://img.shields.io/badge/Inngest-4-purple?style=flat-square)
</div>

---

## Overview

Vertex is a browser-based code editor that lets you write, edit, and preview projects entirely in the cloud. An AI assistant (powered by Google Gemini) is embedded directly into the IDE — you can ask it to create files, refactor code, explain logic, or scaffold entire projects from a single prompt.

Projects can be imported from GitHub and exported back as repositories with a single click.

## Features

- **AI Coding Assistant** — Gemini-powered agent that reads, creates, updates, and organises your files
- **Cloud IDE** — Full code editor (CodeMirror 6) with syntax highlighting, minimap, and tab management
- **Live Preview** — Runs your project in a WebContainer sandbox directly in the browser
- **GitHub Integration** — Import any public or private repository; export projects as new repos
- **Real-time Sync** — File changes persist instantly via Convex's reactive database
- **AI Autocomplete** — Ghost-text inline suggestions as you type
- **Quick Edit** — Select any code, press `⌘K`, describe a change — AI applies it in place
- **Background Jobs** — Long-running tasks (imports, exports, AI responses) handled by Inngest

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | Convex |
| Background Jobs | Inngest |
| AI | Google Gemini 1.5 Flash |
| Auth | Clerk |
| Editor | CodeMirror 6 |
| Preview Sandbox | WebContainer API |
| Web Scraping | Firecrawl |
| Error Tracking | Sentry |
| Styling | Tailwind CSS v4 + shadcn/ui |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Convex](https://convex.dev) account
- A [Clerk](https://clerk.com) account with GitHub OAuth enabled
- A [Google AI Studio](https://aistudio.google.com) API key
- An [Inngest](https://inngest.com) account (free tier)
- A [Firecrawl](https://firecrawl.dev) API key (optional — used for URL scraping in Quick Edit)

### Installation

```bash
git clone https://github.com/Manpreets59/Vertex.git
cd Vertex
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=dev:your-deployment-name
VERTEX_CONVEX_INTERNAL_KEY=your-convex-deployment-key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER_DOMAIN=https://your-domain.clerk.accounts.dev

# Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY=AIza...

# Inngest
INNGEST_DEV=1
INNGEST_BASE_URL=http://localhost:8288
INNGEST_EVENT_KEY=local

# Firecrawl (optional)
FIRECRAWL_API_KEY=fc-...

# Sentry (optional)
SENTRY_DSN=...
SENTRY_AUTH_TOKEN=...
```

> **Getting `VERTEX_CONVEX_INTERNAL_KEY`:** Go to [dashboard.convex.dev](https://dashboard.convex.dev) → your project → Settings → Deployment Keys → copy a key.

> **GitHub Import/Export:** Requires GitHub OAuth enabled in Clerk. Go to Clerk Dashboard → User & Authentication → Social Connections → enable GitHub → add the `repo` scope.

### Running Locally

You need three terminals running simultaneously:

**Terminal 1 — Convex backend:**
```bash
npx convex dev
```

**Terminal 2 — Inngest dev server:**
```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

**Terminal 3 — Next.js app:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Preview Feature

The live preview runs your project inside a [WebContainer](https://webcontainer.io/) sandbox in the browser. It works with any Node.js project that has a `package.json` and a `dev` script.

> **Note:** Turbopack (enabled by default in Next.js 16) is not supported inside WebContainer. If your preview fails to start, go to **Preview Settings** (gear icon in the preview toolbar) and set the Start Command to:
> ```
> npm run dev -- --no-turbo
> ```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   └── api/
│       ├── inngest/        # Inngest serve handler
│       ├── messages/       # Chat message API
│       ├── github/         # Import / export routes
│       ├── quick-edit/     # AI inline edit API
│       └── suggestion/     # AI autocomplete API
├── features/
│   ├── conversations/      # AI chat sidebar + Inngest functions + tools
│   ├── editor/             # CodeMirror editor + extensions
│   ├── preview/            # WebContainer preview + terminal
│   └── projects/           # File explorer, project management, GitHub integration
├── components/             # Shared UI components (shadcn/ui)
├── inngest/                # Inngest client
└── lib/                    # Gemini client, Convex client, utilities
convex/                     # Convex schema, queries, mutations
```

## Deployment

### Convex
```bash
npx convex deploy
```

### Vercel
```bash
vercel deploy
```

Set all environment variables from `.env.local` in your Vercel project settings. Remove `INNGEST_DEV=1` in production and set a real `INNGEST_SIGNING_KEY` from your Inngest dashboard.

## Known Limitations

- WebContainer preview only works in Chromium-based browsers and Firefox 120+ (requires `SharedArrayBuffer`)
- Preview does not support projects that rely on native Node.js bindings or file system access outside the sandbox
- Gemini free tier has rate limits; if you hit quota errors, the app will display an error message and retry after the reset window

## License

MIT
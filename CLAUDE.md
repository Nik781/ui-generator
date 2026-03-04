# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Run production server
npm run lint         # ESLint
npm run test         # Run all tests (Vitest)
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx  # Run single test file
npm run setup        # Install deps + generate Prisma client + migrate DB
npm run db:reset     # Reset SQLite database
npx prisma studio    # Open Prisma database GUI
```

All `dev/build/start` commands require `cross-env NODE_OPTIONS="--require ./node-compat.cjs"` — this is already in the scripts. The `node-compat.cjs` file removes `globalThis.localStorage/sessionStorage` to fix SSR compatibility with Node.js 25+.

## Environment

Copy `.env` and add your key:
```
ANTHROPIC_API_KEY=""   # Leave empty to use mock mode (generates static demo components)
```

## Architecture

UIGen is an AI-powered React component generator. Users describe components in a chat panel; Claude generates code using tool calls; the result renders live in an iframe.

### Core Data Flow

1. User sends a message → `POST /api/chat` with current virtual file system + messages
2. `app/api/chat/route.ts` calls `streamText()` (Vercel AI SDK) with Anthropic Claude (`claude-haiku-4-5` by default)
3. AI responds with tool calls (`str_replace_editor`, `file_manager`) to create/edit files
4. `ChatContext` processes tool calls → updates `FileSystemContext` (in-memory VFS)
5. `PreviewFrame` transforms files via Babel (in-browser) → loads in sandboxed iframe using blob URLs + esm.sh import map for React
6. On stream completion, messages + file system JSON are persisted to SQLite via Prisma

### Key Abstractions

**VirtualFileSystem** (`src/lib/file-system.ts`): In-memory file tree. All generated code lives here — nothing is written to disk. Serialized to JSON and stored in the `Project.data` column.

**Provider** (`src/lib/provider.ts`): Returns either the real Anthropic model or a `MockLanguageModel` when `ANTHROPIC_API_KEY` is not set. Mock mode simulates a 4-step generation with hardcoded demo components.

**AI Tools** (`src/lib/tools/`):
- `str_replace_editor` — view/create/edit files (str_replace and insert operations)
- `file_manager` — rename/delete files

**JSX Transformer** (`src/lib/transform/jsx-transformer.ts`): Compiles all VFS files with `@babel/standalone`, creates blob URLs, generates an HTML document with an import map (React 19 from esm.sh), and loads it in the preview iframe.

### State Management

Two React contexts wrap the entire app:
- `FileSystemContext` — VFS state + selected file, exposes CRUD ops and handles AI tool call results
- `ChatContext` — wraps Vercel AI SDK's `useChat`, calls `/api/chat`, routes tool calls to FileSystemContext

### Authentication

JWT-based (`jose`) with HTTP-only cookies (`auth-token`, 7-day expiry). Passwords hashed with bcrypt. Session helpers are in `src/lib/auth.ts`. Middleware (`src/middleware.ts`) only protects `/api/projects` and `/api/filesystem` — the main `/api/chat` route is open.

Anonymous users can generate components; data is tracked in `sessionStorage` via `src/lib/anon-work-tracker.ts`. Projects are only persisted to the DB for authenticated users.

### Database Schema

The database schema is defined in `prisma/schema.prisma`. Reference it anytime you need to better understand the structure of data stored in the database.

Two models in SQLite (`prisma/dev.db`):
- `User` — email + bcrypt password
- `Project` — `messages` (JSON string of chat history) + `data` (JSON string of VFS), optional `userId` (null = anonymous)

Prisma client is generated to `src/generated/prisma` (not the default location).

### Routing

| Route | Notes |
|-------|-------|
| `/` | Redirects authenticated users to their first project; anonymous users see the editor directly |
| `/[projectId]` | Loads project from DB, requires auth |
| `/api/chat` | Streaming AI endpoint |

### Testing

Tests use Vitest + jsdom + React Testing Library. Test files live alongside source in `__tests__/` subdirectories. No global setup file — each test file is self-contained.

## Instructions

- Use comments to explain the respectively taken steps.
- When executing a command, comment the reasons behind the actions taken, not just what the command does.

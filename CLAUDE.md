# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Setup & Commands

```bash
npm run setup       # Install deps, generate Prisma client, run migrations
npm run dev         # Start dev server (Turbopack) at localhost:3000
npm run build       # Production build
npm run lint        # ESLint check
npm run test        # Run Vitest tests
npm run db:reset    # Reset SQLite database
```

**API Key:** Add `ANTHROPIC_API_KEY` to `.env`. Without it, the app falls back to a `MockLanguageModel` that returns static components.

## Architecture Overview

UIGen is an AI-powered React component generator. Users describe components in a chat; Claude generates them via tool calls into a **virtual file system**; components are rendered live in a sandboxed iframe.

### Data Flow

```
User message → POST /api/chat → Claude (or Mock)
                                    ↓ tool calls
                              str_replace_editor / file_manager
                                    ↓
                          FileSystemContext processes changes
                                    ↓
                    PreviewFrame re-renders iframe | CodeEditor updates
                                    ↓ (if authenticated)
                          Saved to SQLite via Prisma
```

### Key Architectural Decisions

**Virtual File System** (`src/lib/file-system.ts`): All files live in memory as a `VirtualFileSystem` class — no disk writes. Serialized as JSON to store in the database (`projects.data`).

**Tool-Based Generation**: Claude doesn't return code in prose — it uses two structured tools:
- `str_replace_editor` — create, view, or surgically edit files
- `file_manager` — rename or delete files

**Dual Provider** (`src/lib/provider.ts`): Returns real `@ai-sdk/anthropic` client when `ANTHROPIC_API_KEY` is set; otherwise returns `MockLanguageModel` with hardcoded tool-call sequences.

**Iframe Preview** (`src/components/preview/PreviewFrame.tsx`): Generates a full HTML document with an ES module import map and Babel standalone. Entries are resolved as `/App.jsx`, `/App.tsx`, `/index.jsx`, etc. All generated components must use Tailwind CSS and the `@/` path alias (never import HTML files).

**Streaming via Vercel AI SDK**: `POST /api/chat` uses `streamText()` from `ai`. The client-side `ChatContext` wraps `useChat()` and forwards tool results back to `FileSystemContext`.

### State Management

- `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) — owns the in-memory VFS, processes incoming AI tool calls, triggers UI re-renders.
- `ChatContext` (`src/lib/contexts/chat-context.tsx`) — wraps `useChat()`, serializes files before each request, exposes streaming status.

### Authentication

JWT sessions via `jose` stored in an `auth-token` httpOnly cookie (7-day expiry). Server actions in `src/actions/` handle sign-up/in/out and CRUD for projects. Projects belong to optional users — anonymous sessions work but aren't persisted.

### JSX Compilation

`src/lib/transform/jsx-transformer.ts` uses `@babel/standalone` in the browser to compile JSX/TSX to JS, build an import map, and produce the iframe's `srcdoc` HTML.

### System Prompt

`src/lib/prompts/generation.tsx` — defines Claude's behavior: always produce `/App.jsx` as the entrypoint, use Tailwind for styling, use `@/` aliases, keep responses brief.

## Testing

Tests live in `__tests__/` directories co-located with source. Run a single test file:

```bash
npx vitest run src/lib/file-system.test.ts
```

Uses `@testing-library/react` and `@testing-library/user-event`.

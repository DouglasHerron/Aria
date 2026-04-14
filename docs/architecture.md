# ARIA — System Architecture

## High-Level Overview

ARIA is structured as two layers:

1. **Next.js App** — handles frontend rendering, API orchestration, and all cloud API calls (Gmail, Google Calendar, AI providers)
2. **Local Bridge** (Mac-only) — the Next.js API routes read directly from the filesystem for Obsidian, and make CalDAV calls for Apple Calendar from the locally-running dev server

In production (Vercel), the Obsidian and Apple Calendar integrations only work when the local Next.js server is running on Doug's Mac — this is an intentional v1 constraint.

---

## Data Flow

```
User opens dashboard
        │
        ▼
Next.js App loads (app/page.tsx)
        │
        ├── parallel fetch ──► Gmail API route → Gmail API → raw threads
        │                            │
        │                            └──► AI Service (lib/ai) → summaries + urgency scores
        │
        ├── parallel fetch ──► GCal API route → Google Calendar API → events
        │                            │
        │                            └──► AI Service → conflict detection + agenda narrative
        │
        ├── parallel fetch ──► Obsidian route → filesystem (vault) → tasks + notes
        │                            │
        │                            └──► AI Service → priority scores + top-3 focus items
        │
        └── Morning Briefing ────────────────────────────────────────────► AI Service
                                                                           (all sources combined)
        │
        ▼
Dashboard renders with AI-enriched widget data
        │
User acts (send reply / create event / update task)
        │
        ▼
Write action → appropriate API or filesystem → source updated
```

---

## AI Orchestration Layer

The AI layer is **not a chatbot**. It is a set of structured, purpose-built prompt chains called automatically on data load and on user action.

```
lib/ai/
├── index.ts              ← Unified entry point (reads AI_PROVIDER env var)
├── providers/
│   ├── claude.ts         ← Anthropic SDK wrapper implementing AIProvider interface
│   └── openai.ts         ← OpenAI SDK wrapper implementing AIProvider interface
└── prompts/
    ├── email.ts          ← Email processor: summarize, score urgency, draft reply
    ├── calendar.ts       ← Calendar analyzer: conflicts, agenda narrative
    ├── tasks.ts          ← Task prioritizer: score + surface top 3
    ├── briefing.ts       ← Morning briefing: combine all sources
    └── command.ts        ← Command palette: route natural language to module actions
```

### AIProvider Interface

```typescript
interface AIProvider {
  complete(options: {
    prompt: string;
    system: string;
    maxTokens?: number;
  }): Promise<{ text: string }>;

  stream(options: {
    prompt: string;
    system: string;
  }): AsyncIterable<string>;
}
```

All prompts are structured (not open-ended). They return JSON that the app parses and renders. Example email processor output:

```json
{
  "summary": "Alex is asking for the Q2 report by Friday.",
  "urgency": "high",
  "category": "action_needed",
  "draftReply": "Hi Alex, thanks for the heads up. I'll have the Q2 report to you by Thursday EOD..."
}
```

---

## Module Architecture

### Email Intelligence
- **Route:** `app/api/email/`
  - `GET /api/email/threads` — fetches and AI-processes Gmail threads
  - `POST /api/email/send` — sends a reply via Gmail API
- **Client:** `lib/gmail.ts` (uses googleapis npm package)
- **AI:** `lib/ai/prompts/email.ts`
- **Widget:** `components/widgets/EmailWidget.tsx`

### Calendar Management
- **Routes:** `app/api/calendar/`
  - `GET /api/calendar/events` — fetches Google + Apple Calendar events
  - `POST /api/calendar/events` — creates event via Google Calendar API
- **Clients:** `lib/gcal.ts` (googleapis), `lib/caldav.ts` (tsdav)
- **AI:** `lib/ai/prompts/calendar.ts`
- **Widget:** `components/widgets/CalendarWidget.tsx`

### Task & Goal Tracking
- **Routes:** `app/api/tasks/`
  - `GET /api/tasks` — reads Obsidian vault, returns parsed tasks
  - `POST /api/tasks` — creates/updates task markdown in vault
- **Client:** `lib/obsidian.ts` (filesystem reads via Node.js fs module)
- **AI:** `lib/ai/prompts/tasks.ts`
- **Widget:** `components/widgets/TaskWidget.tsx`

### Notes Management
- **Routes:** `app/api/notes/`
  - `GET /api/notes` — browse + search vault
  - `POST /api/notes` — create new note, auto-file to correct folder
- **Client:** `lib/obsidian.ts` (shared with tasks)
- **Widget:** `components/widgets/NotesWidget.tsx`

### Unified Dashboard
- **Command palette:** `components/CommandPalette.tsx` (⌘K)
  - Routes natural language to AI command interpreter
  - AI returns structured action: `{ module, action, params }`
  - Dashboard executes action programmatically
- **Morning Briefing:** `components/widgets/MorningBriefingWidget.tsx`
  - Generated on load by combining all data sources
  - Streamed to UI using AI streaming API

---

## Auth Flow

1. User visits ARIA → redirected to `/api/auth/signin`
2. NextAuth Google OAuth flow → user grants Gmail + Calendar scopes
3. NextAuth stores access + refresh tokens in encrypted session cookie
4. API routes retrieve tokens via `getServerSession()` and attach to API calls
5. Token refresh handled automatically by NextAuth

---

## Deployment

- **Dev:** `npm run dev` on local Mac — all integrations work
- **Vercel:** deploys Next.js app; Obsidian/Apple Cal only work when local server is also running
- **Vercel env vars:** Set all vars from `.env.example` in Vercel dashboard
- **Demo:** Use `DEMO_MODE=true` to serve mock data for stable LinkedIn recording

---

## Key Dependencies

```json
{
  "next": "14.x",
  "next-auth": "5.x",
  "tailwindcss": "3.x",
  "@anthropic-ai/sdk": "latest",
  "openai": "latest",
  "googleapis": "latest",
  "tsdav": "latest",
  "gray-matter": "latest",
  "cmdk": "latest"
}
```

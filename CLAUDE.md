# ARIA — AI-Powered Personal Assistant Dashboard
## Master Project Context for Claude Code

---

## What is ARIA?

ARIA (Adaptive Reasoning & Intelligent Assistant) is a full-stack, AI-powered personal dashboard that consolidates daily workflows — email, calendar, tasks, goals, and notes — into a single, elegant interface. It is Doug's portfolio project demonstrating applied AI process engineering.

**Key philosophy:** ARIA is NOT a chatbot. It surfaces intelligent cards, command palettes, and contextual widgets. The AI layer runs automatically on data load and on user action — it is a set of structured, purpose-built prompt chains, not a conversation UI.

**Target audience for the demo:** Engineering leads, AI product managers, and technical recruiters evaluating AI integration architecture and process automation thinking.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | React + Next.js 14 (App Router) | All routes use the App Router pattern |
| **Styling** | Tailwind CSS + shadcn/ui | Use shadcn components; customize via Tailwind |
| **Backend/API** | Next.js API Routes (Node.js) | No separate server; unified repo |
| **AI Layer** | Anthropic SDK + OpenAI SDK | **Fully model-agnostic from day 1** — see AI Abstraction below |
| **Auth** | NextAuth.js v5 with Google OAuth | Covers Gmail + Google Calendar scopes |
| **Obsidian Bridge** | Filesystem API via local Next.js server | Vault path from `OBSIDIAN_VAULT_PATH` |
| **Apple Calendar** | iCloud CalDAV (read-only in v1) | Local Mac only |
| **Hosting** | Vercel (frontend + API); local bridge for Obsidian/Apple Cal | Free tier |

---

## Repository Structure (Target)

```
aria-dashboard/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Main dashboard page
│   ├── api/
│   │   ├── auth/[...nextauth]/ # NextAuth handler
│   │   ├── email/              # Gmail API routes
│   │   ├── calendar/           # Google + Apple Calendar routes
│   │   ├── tasks/              # Obsidian task routes
│   │   ├── notes/              # Obsidian notes routes
│   │   └── ai/                 # AI orchestration routes
│   └── settings/               # Settings page (model switcher, etc.)
├── components/
│   ├── ui/                     # shadcn/ui components (auto-generated)
│   ├── widgets/
│   │   ├── EmailWidget.tsx
│   │   ├── CalendarWidget.tsx
│   │   ├── TaskWidget.tsx
│   │   ├── NotesWidget.tsx
│   │   └── MorningBriefingWidget.tsx
│   ├── CommandPalette.tsx
│   └── DashboardShell.tsx
├── lib/
│   ├── ai/
│   │   ├── index.ts            # Unified AI service (model-agnostic entry point)
│   │   ├── providers/
│   │   │   ├── claude.ts       # Anthropic SDK wrapper
│   │   │   └── openai.ts       # OpenAI SDK wrapper
│   │   └── prompts/
│   │       ├── email.ts        # Email processor prompts
│   │       ├── calendar.ts     # Calendar analyzer prompts
│   │       ├── tasks.ts        # Task prioritizer prompts
│   │       ├── briefing.ts     # Morning briefing prompts
│   │       └── command.ts      # Command interpreter prompts
│   ├── gmail.ts                # Gmail API client
│   ├── gcal.ts                 # Google Calendar client
│   ├── caldav.ts               # Apple Calendar CalDAV client
│   ├── obsidian.ts             # Obsidian vault filesystem bridge
│   └── auth.ts                 # NextAuth config
├── hooks/
│   ├── useEmail.ts
│   ├── useCalendar.ts
│   ├── useTasks.ts
│   └── useCommandPalette.ts
├── types/
│   └── index.ts                # Shared TypeScript types
├── stories/                    # Claude Code user stories (this folder)
├── docs/                       # Architecture and setup docs
├── .env.local                  # Local secrets (gitignored)
├── .env.example                # Template for env vars
└── CLAUDE.md                   # This file
```

---

## AI Abstraction Layer — CRITICAL PATTERN

The AI layer must be **fully model-agnostic from day 1**. Every AI call goes through `lib/ai/index.ts`. This file reads `process.env.AI_PROVIDER` (defaulting to `'claude'`) and routes calls to the correct provider.

**Never call Anthropic or OpenAI SDKs directly from components or API routes.** Always go through the unified service.

```typescript
// lib/ai/index.ts — the ONLY way to call AI in this project
import { AIService } from './providers/claude';
import { OpenAIService } from './providers/openai';

const provider = process.env.AI_PROVIDER ?? 'claude';

export const ai = provider === 'openai' ? new OpenAIService() : new AIService();

// Usage in any route:
// import { ai } from '@/lib/ai';
// const result = await ai.complete({ prompt: '...', system: '...' });
```

The unified interface exposes:
- `ai.complete({ prompt, system, maxTokens? })` → `{ text: string }`
- `ai.stream({ prompt, system })` → `AsyncIterable<string>`

---

## Environment Variables

See `.env.example` for all required variables. At minimum, Phase 1 needs:
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `AI_PROVIDER` (default: `claude`)
- `OBSIDIAN_VAULT_PATH` = absolute path to your Obsidian vault

---

## Module Overview

### 1. Email Intelligence
- Gmail API: fetch threads, surface high-priority
- AI: per-thread summary, urgency score, pre-drafted reply
- UI: email cards with one-click draft → preview → send flow

### 2. Calendar Management
- Google Calendar API + Apple Calendar CalDAV (read-only)
- Today + week view, AI conflict detection + agenda narrative
- Quick-create via command palette

### 3. Task & Goal Tracking
- Reads/writes Obsidian vault Markdown (task syntax: `- [ ] task`)
- Goal hierarchy: Goals → Milestones → Tasks
- AI prioritization → surfaces today's top 3

### 4. Notes Management
- Browse + search Obsidian vault
- Create notes from dashboard, AI summarization
- Quick-capture → auto-file to correct vault folder
- [[wiki-link]] awareness → surface related notes

### 5. Unified Dashboard
- ⌘K command palette routing natural language to AI
- Widget-based collapsible layout
- Morning Briefing widget (auto-generated on load)
- AI model toggle in settings

---

## How to Use the Stories Folder

Stories are in `stories/phase-N/`. Each story is a self-contained Markdown file with:
- Full context about what it does
- Technical implementation notes
- Acceptance criteria
- Files to create/modify

**To use a story with Claude Code:**
1. Open a new Claude Code session in the `aria-dashboard/` project directory
2. Paste the contents of the story file as your first message
3. Claude Code will implement it and run the app to verify

Work stories in order within each phase. Phases can only start after the prior phase's stories are complete and the app runs without errors.

---

## Key Constraints & Decisions

- **No chatbot UI** — AI is background automation, not foreground chat
- **Mac-local v1** — Obsidian bridge and Apple Calendar run on Doug's Mac
- **No multi-user** — Single-user personal tool
- **Vercel deploy** — Must work on Vercel free tier (API routes only, no long-running processes)
- **Demo-safe mode** — Phase 4 adds a mock data layer so the LinkedIn demo doesn't expose real emails
- **Apple Calendar v1 is read-only** — Write-back is a v2 feature
- **TypeScript throughout** — Strict mode preferred

---

## Out of Scope (V1)

- Multi-user / shared dashboards
- Mobile / PWA
- Voice input
- Slack, Notion integrations
- AI fine-tuning
- Fully cloud-hosted Obsidian sync
- Persistent conversation history

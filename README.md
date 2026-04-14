# ARIA — AI-Powered Personal Assistant Dashboard

[Architecture](#architecture) · [Setup](#setup) · [Demo-safe mode](#demo-safe-mode)

An AI orchestration layer that consolidates **email**, **calendar**, **tasks**, and **notes** into a single intelligent dashboard — built as a portfolio demonstration of applied AI process engineering.

## What it does

- **Morning Briefing**: streams a cross-source briefing on page load (emails + calendar + tasks)
- **Email intelligence**: per-thread summary, urgency score, and one-click draft reply
- **Calendar analysis**: week view with conflict detection + agenda narrative
- **Obsidian tasks/notes**: reads your vault and surfaces today’s focus
- **⌘K command palette**: natural language → structured action routing
- **Model-agnostic AI layer**: switch Claude ↔ OpenAI via Settings (no code changes)

## Architecture

```mermaid
graph TD
  UserBrowser[User_Browser] -->|Dashboard_load| NextApp[Nextjs_App]

  NextApp -->|fetch| EmailRoute[Email_API_Routes]
  NextApp -->|fetch| CalendarRoute[Calendar_API_Routes]
  NextApp -->|fetch| TasksRoute[Tasks_API_Routes]
  NextApp -->|fetch| NotesRoute[Notes_API_Routes]
  NextApp -->|stream| BriefingRoute[Briefing_API_Route]

  EmailRoute --> GmailAPI[Gmail_API]
  CalendarRoute --> GoogleCalAPI[Google_Calendar_API]
  CalendarRoute --> AppleCalDAV[Apple_CalDAV]
  TasksRoute --> ObsidianVault[Obsidian_Vault_FS]
  NotesRoute --> ObsidianVault

  EmailRoute --> AILayer[AI_Orchestration_Layer]
  CalendarRoute --> AILayer
  TasksRoute --> AILayer
  BriefingRoute --> AILayer

  AILayer --> Provider{AI_Provider}
  Provider --> Claude[Claude]
  Provider --> OpenAI[OpenAI]
```

For more detail, see [`docs/architecture.md`](docs/architecture.md).

## AI integration design

ARIA is **not** a chatbot UI. AI runs as structured prompt chains:

- **Email processor**: summarize, urgency score, draft reply (`lib/ai/prompts/email.ts`)
- **Calendar analyzer**: conflicts + agenda narrative (`lib/ai/prompts/calendar.ts`)
- **Task prioritizer**: top-3 focus + scoring (`lib/ai/prompts/tasks.ts`)
- **Morning briefing**: cross-source synthesis, streamed (`lib/ai/prompts/briefing.ts`)
- **Command interpreter**: intent → action JSON (`lib/ai/prompts/command.ts`)

All model calls are routed through the abstraction in `lib/ai/`.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), React 18 |
| UI | Tailwind CSS, shadcn/ui patterns, sonner toasts |
| Auth | NextAuth v5 (Google OAuth) |
| APIs | Gmail + Google Calendar (`googleapis`), Apple CalDAV (`tsdav`) |
| AI | Anthropic SDK, OpenAI SDK (behind a unified interface) |
| Notes/Tasks | Obsidian vault filesystem |

## Setup

**Requirements:** Node.js **18.18+** (see [`.nvmrc`](.nvmrc); use `nvm use` if you use nvm).

| Step | What to do |
|------|------------|
| 1 | Clone this repo and `cd` into the project root. |
| 2 | `npm install` |
| 3 | Create env file: either `npm run setup` (copies [`.env.example`](.env.example) → `.env.local` if missing) **or** `cp .env.example .env.local` |
| 4 | Fill in secrets: **either** edit `.env.local` **or** open [`http://localhost:3000/setup`](http://localhost:3000/setup) after starting the dev server once (wizard writes `.env.local`). |
| 5 | Set `NEXTAUTH_SECRET` (e.g. `openssl rand -base64 32` or the wizard’s **Generate** button). |
| 6 | **Google Cloud:** create **your own** project, enable Gmail + Calendar APIs, create an OAuth **Web client**, add redirect URI `http://localhost:3000/api/auth/callback/google`, then put `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.env.local`. Details: [`docs/api-setup.md`](docs/api-setup.md). |
| 7 | Set `AI_PROVIDER` and the matching API key (`ANTHROPIC_API_KEY` and/or `OPENAI_API_KEY`), or configure Ollama. |
| 8 | Set `OBSIDIAN_VAULT_PATH` to an **absolute** path to your vault (tasks use Markdown `- [ ]` anywhere under that folder). Optional: `OBSIDIAN_REST_API_KEY` for the Local REST API plugin. |
| 9 | Optional: Apple Calendar — `APPLE_CALDAV_*` in `.env.local` ([`docs/api-setup.md`](docs/api-setup.md)). |
| 10 | If you used the wizard: **restart** the dev server so Next.js reloads env vars. Then `npm run dev`, sign in with Google, and open [`/api/health`](http://localhost:3000/api/health) to sanity-check config. |

**Security:** Never commit `.env.local` or real API keys. Each developer or machine needs **their own** Google OAuth client and keys.

**Google Auth and “GCP”:** Gmail and Google Calendar access require an OAuth client registered in Google Cloud. That is **some** Google Cloud project—not necessarily the original author’s. Self-hosted installs should use **their own** project. A shared client id/secret in a public repo is unsafe and impractical for restricted Gmail scopes. MCP or other wrappers do not remove that requirement.

**Setup wizard limits:** `POST /api/setup` is allowed in **development** by default. On **production** builds it is disabled unless `SETUP_WIZARD_ENABLED=true` (and should only be used from **localhost**). Hosted deployments (e.g. Vercel) should use the host’s environment variable UI, not file writes from the browser.

## Demo-safe mode

For recording a public demo without leaking personal data:

- Set `DEMO_MODE=true` in `.env.local`
- Restart the dev server

When enabled, ARIA shows realistic mock data and **disables write actions** (send email, create tasks/notes/events, command writes).

## Portfolio context

This project is meant to demonstrate **AI orchestration and product thinking**: data ingestion, structured prompt chains, progressive enhancement, and model-agnostic design — not just “call an LLM and print text.”

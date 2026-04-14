# ARIA — Stories for Claude Code

## How to Use These Stories

Each story is a self-contained Markdown file. To implement a story with Claude Code:

1. **Open a terminal** in the `aria-dashboard/` project directory (the Next.js project root)
2. **Run Claude Code:** `claude`
3. **Paste the story file content** as your first message
4. Claude Code will implement it, run the dev server to verify, and report back
5. Once complete and working, move to the next story

**Important:** Work stories in order within each phase. Never skip ahead — later stories depend on earlier ones.

Paths, names, and examples in story files are **illustrative**; configure your machine via `.env.local` or `/setup`.

---

## Story Map

### Phase 1 — Foundation & Auth (Days 1–3)
| Story | Title | Est. Time |
|---|---|---|
| [1.1](./phase-1/1.1-nextjs-scaffold.md) | Next.js + Tailwind + shadcn/ui Scaffold | 1–2 hrs |
| [1.2](./phase-1/1.2-google-oauth.md) | Google OAuth via NextAuth.js | 1–2 hrs |
| [1.3](./phase-1/1.3-ai-abstraction-service.md) | AI Abstraction Service | 1–2 hrs |
| [1.4](./phase-1/1.4-env-config.md) | Environment Configuration & Validation | 30 min |
| [1.5](./phase-1/1.5-dashboard-shell.md) | Dashboard Shell & Widget Grid | 2–3 hrs |

### Phase 2 — Core Integrations (Days 4–10)
| Story | Title | Est. Time |
|---|---|---|
| [2.1](./phase-2/2.1-gmail-integration.md) | Gmail API Integration | 2–3 hrs |
| [2.2](./phase-2/2.2-google-calendar.md) | Google Calendar API | 1–2 hrs |
| [2.3](./phase-2/2.3-apple-calendar-caldav.md) | Apple Calendar via CalDAV | 2–3 hrs |
| [2.4](./phase-2/2.4-obsidian-bridge-read.md) | Obsidian Bridge — Read Vault | 1–2 hrs |
| [2.5](./phase-2/2.5-obsidian-writeback.md) | Obsidian Write-Back | 1–2 hrs |

### Phase 3 — AI Intelligence Layer (Days 11–17)
| Story | Title | Est. Time |
|---|---|---|
| [3.1](./phase-3/3.1-email-ai-processor.md) | Email AI Processor | 2–3 hrs |
| [3.2](./phase-3/3.2-calendar-ai-analyzer.md) | Calendar AI Analyzer | 1–2 hrs |
| [3.3](./phase-3/3.3-task-prioritizer-ai.md) | Task Prioritizer AI | 1–2 hrs |
| [3.4](./phase-3/3.4-morning-briefing.md) | Morning Briefing Generator | 1–2 hrs |
| [3.5](./phase-3/3.5-command-palette.md) | Command Palette with AI Routing | 2–3 hrs |

### Phase 4 — Polish & Demo Prep (Days 18–24)
| Story | Title | Est. Time |
|---|---|---|
| [4.1](./phase-4/4.1-ui-polish.md) | UI Polish — Animations & Responsive | 2–3 hrs |
| [4.2](./phase-4/4.2-model-switcher.md) | Model Switcher UI (Settings) | 1 hr |
| [4.3](./phase-4/4.3-demo-mock-mode.md) | Demo-Safe Mock Data Mode | 1–2 hrs |
| [4.4](./phase-4/4.4-performance-optimization.md) | Performance Optimization | 1–2 hrs |
| [4.5](./phase-4/4.5-launch-prep.md) | Launch Prep — README, Diagrams, Deploy | 2–3 hrs |

---

## Definition of Done (All Stories)

- [ ] The Next.js dev server starts without errors (`npm run dev`)
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] The feature works end-to-end as described in Acceptance Criteria
- [ ] No hardcoded API keys or secrets in source files
- [ ] Code is committed with a clear commit message

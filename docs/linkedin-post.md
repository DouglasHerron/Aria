I built ARIA — an AI-powered personal dashboard that replaces my tab-switching workflow.

What it does:
→ Auto-reads and summarizes my inbox on load (no clicking)
→ Pre-drafts email replies I can send in one click
→ Detects calendar conflicts before I notice them
→ Surfaces my top 3 tasks for the day from my Obsidian vault
→ Streams a full morning briefing on open
→ ⌘K command palette to turn natural language into actions

What I’m most proud of architecturally:
The AI layer is fully model-agnostic — Claude and OpenAI sit behind the same interface. Switching providers is a Settings toggle, not a refactor.

Stack: Next.js, Tailwind, shadcn/ui patterns, Anthropic SDK, OpenAI SDK, NextAuth, Gmail API, Google Calendar, Apple CalDAV

[Live demo: link] | [GitHub: link] | [Video: link]

Built as a portfolio project demonstrating AI process engineering — not just prompting, but orchestration.

#AI #SoftwareEngineering #BuildInPublic #Nextjs


import { getAI } from "@/lib/ai";
import {
  promptUserContextLine,
  promptUserThirdPerson,
} from "@/lib/user-prompt";
import type { CalendarEvent, EmailThread, ObsidianTask } from "@/types";

function buildBriefingSystemPrompt(): string {
  const who = promptUserThirdPerson();
  const context = promptUserContextLine();
  return `You are ARIA, an intelligent personal assistant dashboard. Generate a concise, professional morning briefing for ${who}.

About this person: ${context}

The briefing should:
- Be 3-4 short paragraphs
- Start with a greeting and today's date
- Cover: key emails needing attention, today's schedule highlights, top tasks to focus on
- Be written in second person ("You have...", "Your first meeting...")
- End with one motivating sentence
- Tone: professional but warm, like a trusted assistant
- Length: 150-200 words maximum`;
}

export async function generateMorningBriefing(data: {
  urgentEmails: EmailThread[];
  todayEvents: CalendarEvent[];
  topTasks: ObsidianTask[];
  agendaNarrative?: string;
  focusSuggestion?: string;
}): Promise<AsyncGenerator<string>> {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = `Generate a morning briefing for ${today}.

URGENT EMAILS (${data.urgentEmails.length}):
${data.urgentEmails
  .slice(0, 3)
  .map((e) => `- From ${e.from}: ${e.summary ?? e.snippet}`)
  .join("\n") || "None"}

TODAY'S SCHEDULE (${data.todayEvents.length} events):
${data.todayEvents
  .slice(0, 5)
  .map((e) => {
    const t = e.start.includes("T")
      ? new Date(e.start).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })
      : "All day";
    return `- ${t}: ${e.title}`;
  })
  .join("\n") || "Clear schedule"}

TOP TASKS:
${data.topTasks
  .slice(0, 3)
  .map((t, i) => `${i + 1}. ${t.text}${t.dueDate ? ` (due ${t.dueDate})` : ""}`)
  .join("\n") || "No urgent tasks"}

${data.agendaNarrative ? `Schedule context: ${data.agendaNarrative}` : ""}
${data.focusSuggestion ? `Task context: ${data.focusSuggestion}` : ""}`;

  return getAI().stream({
    system: buildBriefingSystemPrompt(),
    prompt,
    maxTokens: 500,
  });
}

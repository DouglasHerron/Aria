import { getAI } from "@/lib/ai";
import { parseJsonFromAI } from "@/lib/ai/prompts/_json";
import type { CalendarEvent } from "@/types";

const CALENDAR_SYSTEM_PROMPT = `You are ARIA's calendar intelligence processor. Analyze a list of calendar events and return structured JSON.

Always return valid JSON with this structure:
{
  "agendaNarrative": "2-3 sentence human-friendly summary of today's schedule and what to be aware of",
  "conflicts": [
    {
      "event1Id": "event-id-1",
      "event2Id": "event-id-2",
      "description": "These two events overlap by 30 minutes"
    }
  ],
  "enrichedEvents": [
    {
      "id": "event-id",
      "agendaSummary": "Brief note or prep suggestion for this event",
      "hasConflict": false
    }
  ]
}

Conflict detection: Two events conflict if their time ranges overlap. Mark both events as hasConflict: true.
Agenda narrative: Be concise and helpful. Mention the total number of events, any conflicts, and what the busiest period is.
Event summaries: If an event title is vague (e.g., "Meeting"), suggest what to prepare. If it's clear, just confirm the time.`;

export interface CalendarAIResult {
  agendaNarrative: string;
  conflicts: Array<{ event1Id: string; event2Id: string; description: string }>;
  enrichedEvents: Array<{ id: string; agendaSummary: string; hasConflict: boolean }>;
}

export async function analyzeCalendarEvents(
  events: CalendarEvent[],
): Promise<CalendarAIResult> {
  if (events.length === 0) {
    return {
      agendaNarrative: "Your schedule is clear. A great day to focus on deep work.",
      conflicts: [],
      enrichedEvents: [],
    };
  }

  const today = new Date().toISOString().split("T")[0]!;
  const todayEvents = events.filter((e) => e.start.startsWith(today));

  const prompt = `Analyze these calendar events:

${events
  .map(
    (e) => `ID: ${e.id}
Title: ${e.title}
Start: ${e.start}
End: ${e.end}
Source: ${e.source}
`,
  )
  .join("\n")}

Today is ${today}. Events today: ${todayEvents.length}. Total events this week: ${events.length}.`;

  const result = await getAI().complete({
    system: CALENDAR_SYSTEM_PROMPT,
    prompt,
    maxTokens: 768,
  });

  const parsed = parseJsonFromAI<CalendarAIResult>(result.text);
  if (parsed.ok) return parsed.value;

  return {
    agendaNarrative: `You have ${todayEvents.length} event(s) today and ${events.length} this week.`,
    conflicts: [],
    enrichedEvents: events.map((e) => ({
      id: e.id,
      agendaSummary: "",
      hasConflict: false,
    })),
  };
}


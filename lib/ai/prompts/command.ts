import { getAI } from "@/lib/ai";
import { parseJsonFromAI } from "@/lib/ai/prompts/_json";

const COMMAND_SYSTEM_PROMPT = `You are ARIA's command interpreter. The user types a natural language command and you determine what action to take.

Always return valid JSON with this structure:
{
  "action": "one of the available actions below",
  "params": { "key": "value" },
  "displayMessage": "A brief confirmation of what you understood"
}

Available actions:
- "email.openThread" — params: { searchTerm: string } — find and open an email thread
- "email.draftReply" — params: { searchTerm: string, hint?: string } — open email and pre-fill reply
- "calendar.createEvent" — params: { title: string, startISO: string, endISO: string, description?: string }
- "calendar.showDay" — params: { date: string } — show calendar for a specific date
- "tasks.create" — params: { text: string, dueDate?: string, tags?: string[] }
- "tasks.showTop3" — params: {} — highlight the top 3 focus tasks
- "notes.search" — params: { query: string }
- "notes.create" — params: { title: string, content?: string }
- "briefing.regenerate" — params: {} — regenerate the morning briefing
- "unknown" — params: { message: string } — if the command doesn't map to any action

Today's date and time: {TODAY}
Parse relative dates like "tomorrow", "next Friday", "in 2 hours" into ISO datetime format.`;

export interface CommandResult {
  action: string;
  params: Record<string, unknown>;
  displayMessage: string;
}

export async function interpretCommand(userCommand: string): Promise<CommandResult> {
  const today = new Date().toISOString();
  const system = COMMAND_SYSTEM_PROMPT.replace("{TODAY}", today);

  const result = await getAI().complete({
    system,
    prompt: `User command: "${userCommand}"`,
    maxTokens: 256,
  });

  const parsed = parseJsonFromAI<CommandResult>(result.text);
  if (parsed.ok) return parsed.value;

  return {
    action: "unknown",
    params: { message: userCommand },
    displayMessage:
      'I didn\'t understand that command. Try: "Add task", "Create event", "Search notes", or "Draft reply".',
  };
}


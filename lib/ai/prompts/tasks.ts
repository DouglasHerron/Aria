import { getAI } from "@/lib/ai";
import { parseJsonFromAI } from "@/lib/ai/prompts/_json";
import { promptUserThirdPerson } from "@/lib/user-prompt";
import type { ObsidianTask } from "@/types";

function buildTaskSystemPrompt(): string {
  const who = promptUserThirdPerson();
  return `You are ARIA's task prioritization engine. Analyze a list of open tasks and return structured JSON.

Prioritization criteria (in order of importance):
1. Due date: overdue tasks are critical; due today are high; due this week are medium
2. Task text keywords: words like "urgent", "ASAP", "deadline", "submit", "review" indicate high priority
3. Context: work tasks during business hours, school tasks before deadlines

Always return valid JSON with this structure:
{
  "top3": ["task-id-1", "task-id-2", "task-id-3"],
  "scores": [
    { "id": "task-id", "score": 0-100, "reason": "Brief reason for this score" }
  ],
  "focusSuggestion": "One sentence about what ${who} should tackle first today and why"
}

Score 0-100: 90-100 = critical/overdue, 70-89 = high, 40-69 = medium, 0-39 = low
top3: The IDs of the 3 highest priority tasks ${who} should focus on today`;
}

export interface TaskPrioritizationResult {
  top3: string[];
  scores: Array<{ id: string; score: number; reason: string }>;
  focusSuggestion: string;
}

function localISODate(d = new Date()) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

export async function prioritizeTasks(
  tasks: ObsidianTask[],
): Promise<TaskPrioritizationResult> {
  if (tasks.length === 0) {
    return {
      top3: [],
      scores: [],
      focusSuggestion: "No open tasks. Consider reviewing your goals or planning ahead.",
    };
  }

  const today = localISODate();
  const limited = tasks.slice(0, 50);

  const prompt = `Today is ${today}. Prioritize these ${limited.length} open tasks:

${limited
  .map(
    (t) => `ID: ${t.id}
Text: ${t.text}
Due: ${t.dueDate ?? "No due date"}
File: ${t.filePath}
Tags: ${t.tags?.join(", ") ?? "none"}
`,
  )
  .join("\n")}`;

  const result = await getAI().complete({
    system: buildTaskSystemPrompt(),
    prompt,
    maxTokens: 768,
  });

  const parsed = parseJsonFromAI<TaskPrioritizationResult>(result.text);
  if (parsed.ok) return parsed.value;

  const sorted = [...tasks].sort((a, b) => {
    const ad = a.dueDate ?? "";
    const bd = b.dueDate ?? "";
    if (ad && bd) return ad.localeCompare(bd);
    if (ad) return -1;
    if (bd) return 1;
    return 0;
  });

  return {
    top3: sorted.slice(0, 3).map((t) => t.id),
    scores: tasks.map((t) => ({ id: t.id, score: 50, reason: "Default priority" })),
    focusSuggestion: "Focus on your earliest due date tasks first.",
  };
}


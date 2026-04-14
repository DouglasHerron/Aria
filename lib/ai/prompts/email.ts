import { getAI } from "@/lib/ai";
import { getCachedText, makeCacheKey, setCachedText } from "@/lib/ai/cache";
import { parseJsonFromAI } from "@/lib/ai/prompts/_json";
import {
  emailSignatureClosing,
  promptUserThirdPerson,
} from "@/lib/user-prompt";
import type { EmailThread } from "@/types";

function buildEmailSystemPrompt(): string {
  const who = promptUserThirdPerson();
  return `You are ARIA's email intelligence processor. Your job is to analyze email threads and return structured JSON.

You must ALWAYS return valid JSON with this exact structure:
{
  "summary": "1-2 sentence summary of what this email is about and what action (if any) is needed",
  "urgency": "high" | "medium" | "low",
  "category": "action_needed" | "fyi" | "archive",
  "draftReply": "A complete, professional reply that ${who} can send with one click. Match the tone of the original email."
}

Urgency guidelines:
- high: Requires action within 24 hours, or sender is waiting for a response
- medium: Requires action this week
- low: FYI, no action needed, or can be archived

Category guidelines:
- action_needed: ${who} needs to respond or do something
- fyi: Informational, no action required
- archive: Promotions, notifications, newsletters, auto-generated emails`;
}

export type EmailAIResult = {
  summary: string;
  urgency: "high" | "medium" | "low";
  category: "action_needed" | "fyi" | "archive";
  draftReply: string;
};

export async function processEmailThread(
  thread: Pick<EmailThread, "subject" | "from" | "snippet">,
  body: string,
): Promise<EmailAIResult> {
  const PROMPT_VERSION = "v1";

  const prompt = `Analyze this email thread and return a JSON response:

Subject: ${thread.subject}
From: ${thread.from}
Body:
${body.slice(0, 2000)}`;

  const cacheKey = makeCacheKey({
    v: PROMPT_VERSION,
    subject: thread.subject,
    from: thread.from,
    snippet: thread.snippet,
    body: body.slice(0, 2000),
  });
  const cached = await getCachedText({ namespace: "email", key: cacheKey });
  if (cached) {
    const parsed = parseJsonFromAI<EmailAIResult>(cached);
    if (parsed.ok) return parsed.value;
  }

  const result = await getAI().complete({
    system: buildEmailSystemPrompt(),
    prompt,
    maxTokens: 512,
  });

  await setCachedText({
    namespace: "email",
    key: cacheKey,
    value: result.text,
    ttlMs: 1000 * 60 * 60 * 24 * 7, // 7 days
  }).catch(() => {});

  const parsed = parseJsonFromAI<EmailAIResult>(result.text);
  if (parsed.ok) return parsed.value;

  const closing = emailSignatureClosing();
  return {
    summary: thread.snippet,
    urgency: "medium",
    category: "action_needed",
    draftReply: `Hi,\n\nThank you for your email. I'll get back to you shortly.\n\n${closing}`,
  };
}


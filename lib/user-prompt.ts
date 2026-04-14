import { getConfig } from "@/lib/config";

/** Second-person-friendly label for prompts (e.g. "you" or the user's first name). */
export function promptUserDisplayName(): string {
  const n = getConfig().ariaUserName;
  return n || "you";
}

/** Third-person label for JSON schema instructions ("the user" or name). */
export function promptUserThirdPerson(): string {
  const n = getConfig().ariaUserName;
  return n || "the user";
}

/** One sentence of optional context for briefing-style prompts. */
export function promptUserContextLine(): string {
  const c = getConfig().ariaUserContext;
  return c || "They value clear, actionable summaries and efficient communication.";
}

export function emailSignatureClosing(): string {
  const n = getConfig().ariaUserName;
  return n || "Best regards";
}

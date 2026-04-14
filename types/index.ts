// ARIA — Shared TypeScript types
// Add module-specific types here as stories are implemented

export type AIProvider = "claude" | "openai" | "ollama";

export type AIMode = "off" | "on_demand" | "auto";

export interface EmailThread {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  unread: boolean;
  // AI-enriched fields (populated after AI processing)
  summary?: string;
  urgency?: "high" | "medium" | "low";
  category?: "action_needed" | "fyi" | "archive";
  draftReply?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  source: "google" | "apple";
  location?: string;
  description?: string;
  // AI-enriched
  agendaSummary?: string;
  hasConflict?: boolean;
}

export interface ObsidianTask {
  id: string;
  text: string;
  completed: boolean;
  filePath: string;
  lineNumber: number;
  dueDate?: string;
  tags?: string[];
  // AI-enriched
  priorityScore?: number;
  focusRank?: number; // 1, 2, or 3 if in today's top 3
}

export interface ObsidianNote {
  path: string;
  title: string;
  content: string;
  folder: string;
  created: string;
  modified: string;
  tags?: string[];
}

export interface MorningBriefing {
  generatedAt: string;
  summary: string; // Full AI-generated briefing text
  topTasks: ObsidianTask[];
  todayEvents: CalendarEvent[];
  urgentEmails: EmailThread[];
}

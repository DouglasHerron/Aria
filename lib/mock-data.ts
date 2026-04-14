import type { CalendarEvent, EmailThread, ObsidianNote, ObsidianTask } from "@/types";

const toDateKey = (date: Date) => date.toISOString().split("T")[0]!;

const today = new Date();
const TODAY = toDateKey(today);
const TOMORROW = toDateKey(new Date(Date.now() + 86_400_000));

export const MOCK_EMAIL_THREADS: EmailThread[] = [
  {
    id: "demo-email-1",
    subject: "Q3 Architecture Review — Input Needed",
    from: "Sarah Chen <sarah.chen@company.com>",
    snippet:
      "Hi, I've shared the architecture doc. Would love your review before Thursday's meeting.",
    date: new Date(Date.now() - 3_600_000).toISOString(),
    unread: true,
    urgency: "high",
    category: "action_needed",
    summary:
      "Sarah needs your review of the Q3 architecture document before Thursday's team meeting.",
    draftReply:
      "Hi Sarah,\n\nThanks for sharing the architecture doc. I'll review it by Wednesday EOD and add comments.\n\nBest,\nAlex",
  },
  {
    id: "demo-email-2",
    subject: "Team standup notes — April 13",
    from: "Marcus T. <marcus@company.com>",
    snippet:
      "Notes from today's standup. No blockers reported. Next milestone on track.",
    date: new Date(Date.now() - 7_200_000).toISOString(),
    unread: false,
    urgency: "low",
    category: "fyi",
    summary:
      "Standup recap from today. No blockers, milestone is on track.",
    draftReply: "Thanks for the notes, Marcus!",
  },
  {
    id: "demo-email-3",
    subject: "Scholarship application deadline reminder",
    from: "Financial Aid <finaid@university.edu>",
    snippet:
      "This is a reminder that scholarship applications close April 20th.",
    date: new Date(Date.now() - 86_400_000).toISOString(),
    unread: true,
    urgency: "high",
    category: "action_needed",
    summary:
      "Scholarship application deadline is April 20th — action required.",
    draftReply: "",
  },
];

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: "demo-cal-1",
    title: "Team Standup",
    start: `${TODAY}T09:00:00`,
    end: `${TODAY}T09:30:00`,
    source: "google",
    agendaSummary: "Daily sync — prepare any blockers to share.",
    hasConflict: false,
  },
  {
    id: "demo-cal-2",
    title: "ARIA Architecture Review",
    start: `${TODAY}T14:00:00`,
    end: `${TODAY}T15:00:00`,
    source: "google",
    agendaSummary: "Review the AI orchestration layer design with the team.",
    hasConflict: false,
  },
  {
    id: "demo-cal-3",
    title: "CS 301 Lecture",
    start: `${TOMORROW}T10:00:00`,
    end: `${TOMORROW}T11:30:00`,
    source: "apple",
    agendaSummary: "Review chapter 8 notes before class.",
    hasConflict: false,
  },
];

export const MOCK_TASKS: ObsidianTask[] = [
  {
    id: "demo-task-1",
    text: "Review architecture document before Thursday meeting",
    completed: false,
    filePath: "Tasks/Work.md",
    lineNumber: 5,
    dueDate: TOMORROW,
    tags: ["work", "review"],
    priorityScore: 92,
    focusRank: 1,
  },
  {
    id: "demo-task-2",
    text: "Submit scholarship application",
    completed: false,
    filePath: "Tasks/School.md",
    lineNumber: 3,
    dueDate: `${TODAY.split("-")[0]}-04-20`,
    tags: ["school", "deadline"],
    priorityScore: 85,
    focusRank: 2,
  },
  {
    id: "demo-task-3",
    text: "Deploy ARIA dashboard to Vercel",
    completed: false,
    filePath: "Tasks/Work.md",
    lineNumber: 12,
    dueDate: undefined,
    tags: ["aria", "deploy"],
    priorityScore: 71,
    focusRank: 3,
  },
  {
    id: "demo-task-4",
    text: "Weekly review — capture wins and blockers",
    completed: false,
    filePath: "Tasks/Personal.md",
    lineNumber: 1,
    dueDate: undefined,
    tags: ["weekly", "reflection"],
    priorityScore: 45,
    focusRank: undefined,
  },
];

export const MOCK_NOTES: ObsidianNote[] = [
  {
    path: "Notes/Work/ARIA Architecture.md",
    title: "ARIA Architecture",
    content:
      "Notes on the AI orchestration layer, model abstraction, and data flow...",
    folder: "Notes/Work",
    created: TODAY,
    modified: TODAY,
    tags: ["aria", "architecture"],
  },
  {
    path: "Notes/School/CS 301 - Week 12.md",
    title: "CS 301 — Week 12",
    content:
      "Lecture notes on distributed systems, CAP theorem, and consistency models...",
    folder: "Notes/School",
    created: TOMORROW,
    modified: TOMORROW,
    tags: ["cs301", "school"],
  },
];

export const MOCK_MORNING_BRIEFING = `Good morning! It's ${new Date().toLocaleDateString(
  "en-US",
  { weekday: "long", month: "long", day: "numeric" },
)}.

You have 2 high-priority emails waiting: Sarah needs your architecture review before Thursday, and there's a scholarship deadline on April 20th you should address today.

Your schedule has 2 events: a team standup at 9am and an ARIA architecture review at 2pm — a focused day. Your top task is the architecture document review, which aligns perfectly with this afternoon's meeting.

Make the scholarship application your first task after standup — it has a hard deadline. You've got this.`;


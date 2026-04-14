import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { auth } from "@/lib/auth";
import { prioritizeTasks } from "@/lib/ai/prompts/tasks";
import { getConfig } from "@/lib/config";
import { ObsidianVaultConfigurationError } from "@/lib/obsidian-vault-error";
import { createTask, markTaskComplete, readAllTasks } from "@/lib/obsidian";

const getCachedTasks = unstable_cache(
  async () => readAllTasks(),
  ["obsidian-tasks"],
  { revalidate: 30 },
);

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getConfig();
  if (config.demoMode) {
    const tasks = getMockTasks();
    return NextResponse.json({
      tasks: tasks.map((t) => ({
        ...t,
        priorityScore: t.id === "mock-task-1" ? 92 : t.id === "mock-task-2" ? 75 : 40,
        focusRank: t.id === "mock-task-1" ? 1 : t.id === "mock-task-2" ? 2 : 3,
      })),
      top3Ids: ["mock-task-1", "mock-task-2", "mock-task-3"],
      focusSuggestion: "Start with the architecture doc while it’s fresh, then knock out the homework submission.",
    });
  }

  try {
    const tasks = await getCachedTasks();
    const prioritization = await prioritizeTasks(tasks).catch(() => null);

    const enrichedTasks = tasks.map((task) => {
      const score = prioritization?.scores.find((s) => s.id === task.id);
      const rankIndex = prioritization?.top3.indexOf(task.id) ?? -1;
      return {
        ...task,
        priorityScore: score?.score,
        focusRank: rankIndex >= 0 ? rankIndex + 1 : undefined,
      };
    });

    return NextResponse.json({
      tasks: enrichedTasks,
      top3Ids: prioritization?.top3 ?? [],
      focusSuggestion: prioritization?.focusSuggestion ?? null,
    });
  } catch (error) {
    console.error("Obsidian tasks error:", error);
    if (error instanceof ObsidianVaultConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Failed to read vault tasks" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const configPost = getConfig();
  if (configPost.demoMode) {
    return NextResponse.json(
      { error: "Writes disabled in demo mode" },
      { status: 403 },
    );
  }

  const body = (await request.json()) as Record<string, unknown>;
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const targetFile =
    typeof body.targetFile === "string" ? body.targetFile : undefined;
  const dueDate =
    typeof body.dueDate === "string" ? body.dueDate : undefined;
  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === "string")
    : undefined;

  try {
    const result = createTask(text, { targetFile, dueDate, tags });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ObsidianVaultConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const configPatch = getConfig();
  if (configPatch.demoMode) {
    return NextResponse.json(
      { error: "Writes disabled in demo mode" },
      { status: 403 },
    );
  }

  const body = (await request.json()) as Record<string, unknown>;
  const filePath =
    typeof body.filePath === "string" ? body.filePath : undefined;
  const lineNumber = body.lineNumber;

  if (filePath === undefined || typeof lineNumber !== "number") {
    return NextResponse.json(
      { error: "filePath and lineNumber required" },
      { status: 400 },
    );
  }

  try {
    markTaskComplete(filePath, lineNumber);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ObsidianVaultConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

function getMockTasks() {
  const today = new Date().toISOString().split("T")[0]!;
  return [
    {
      id: "mock-task-1",
      text: "Review ARIA architecture doc",
      completed: false,
      filePath: "Tasks/Work.md",
      lineNumber: 5,
      dueDate: today,
    },
    {
      id: "mock-task-2",
      text: "Submit homework assignment",
      completed: false,
      filePath: "Tasks/School.md",
      lineNumber: 3,
      dueDate: null,
    },
    {
      id: "mock-task-3",
      text: "Grocery shopping",
      completed: false,
      filePath: "Tasks/Personal.md",
      lineNumber: 1,
      dueDate: null,
    },
  ];
}

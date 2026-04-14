import { auth } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { generateMorningBriefing } from "@/lib/ai/prompts/briefing";
import { getCachedText, makeCacheKey, setCachedText } from "@/lib/ai/cache";
import { MOCK_MORNING_BRIEFING } from "@/lib/mock-data";
import { fetchInboxThreads } from "@/lib/gmail";
import { fetchWeekEvents } from "@/lib/gcal";
import { readAllTasks } from "@/lib/obsidian";
import { readSettingsFromCookies } from "@/lib/settings";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const config = getConfig();
  const settings = readSettingsFromCookies();
  if (settings.aiMode === "off") {
    return new Response("AI is disabled (aiMode=off)", { status: 409 });
  }

  if (config.demoMode) {
    const text = MOCK_MORNING_BRIEFING;
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        for (const char of text) {
          controller.enqueue(encoder.encode(char));
          await new Promise((r) => setTimeout(r, 15));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }

  const [rawThreads, rawEvents, rawTasks] = await Promise.allSettled([
    fetchInboxThreads(session.accessToken, 5),
    fetchWeekEvents(session.accessToken),
    Promise.resolve(readAllTasks()),
  ]);

  const threads = rawThreads.status === "fulfilled" ? rawThreads.value : [];
  const allEvents = rawEvents.status === "fulfilled" ? rawEvents.value : [];
  const tasks = rawTasks.status === "fulfilled" ? rawTasks.value : [];

  const todayKey = new Date().toISOString().split("T")[0]!;
  const todayEvents = allEvents.filter((e) => e.start.startsWith(todayKey));
  const urgentEmails = threads.filter((t) => t.urgency === "high" || t.unread);

  const cacheKey = makeCacheKey({
    v: "v1",
    date: todayKey,
    urgentEmails: urgentEmails.slice(0, 3).map((t) => ({
      id: t.id,
      from: t.from,
      snippet: t.summary ?? t.snippet,
      unread: t.unread,
      urgency: t.urgency,
    })),
    todayEvents: todayEvents.slice(0, 5).map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start,
    })),
    topTasks: tasks.slice(0, 3).map((t) => ({
      id: t.id,
      text: t.text,
      dueDate: t.dueDate,
    })),
  });
  const cachedText = await getCachedText({ namespace: "briefing", key: cacheKey });
  if (cachedText) {
    return new Response(cachedText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }

  const stream = await generateMorningBriefing({
    urgentEmails,
    todayEvents,
    topTasks: tasks.slice(0, 3),
  });

  const readableStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      let full = "";
      try {
        for await (const chunk of stream) {
          full += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } finally {
        controller.close();
        void setCachedText({
          namespace: "briefing",
          key: cacheKey,
          value: full,
          ttlMs: 1000 * 60 * 60, // 1 hour
        }).catch(() => {});
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}


import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { analyzeCalendarEvents } from "@/lib/ai/prompts/calendar";
import { fetchAppleCalendarEvents } from "@/lib/caldav";
import { getConfig } from "@/lib/config";
import { createEvent, fetchWeekEvents } from "@/lib/gcal";
import { MOCK_CALENDAR_EVENTS } from "@/lib/mock-data";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getConfig();
  if (config.demoMode) {
    return NextResponse.json({
      events: MOCK_CALENDAR_EVENTS,
      agendaNarrative:
        "You have a light schedule this week. Today starts with a quick standup, then you can focus on deep work.",
      conflicts: [],
    }, {
      headers: {
        "Cache-Control": "private, max-age=0, s-maxage=60, stale-while-revalidate=120",
      },
    });
  }

  try {
    const [googleEvents, appleEvents] = await Promise.all([
      fetchWeekEvents(session.accessToken),
      fetchAppleCalendarEvents(),
    ]);
    const allEvents = [...googleEvents, ...appleEvents].sort((a, b) =>
      a.start.localeCompare(b.start),
    );

    const aiAnalysis = await analyzeCalendarEvents(allEvents).catch(() => null);

    const events = allEvents.map((event) => {
      const aiEvent = aiAnalysis?.enrichedEvents.find((e) => e.id === event.id);
      return {
        ...event,
        agendaSummary: aiEvent?.agendaSummary,
        hasConflict: aiEvent?.hasConflict ?? false,
      };
    });

    return NextResponse.json({
      events,
      agendaNarrative: aiAnalysis?.agendaNarrative ?? null,
      conflicts: aiAnalysis?.conflicts ?? [],
    }, {
      headers: {
        "Cache-Control": "private, max-age=0, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Google Calendar fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const config = getConfig();
  if (config.demoMode) {
    return NextResponse.json(
      { error: "Writes disabled in demo mode" },
      { status: 403 },
    );
  }

  const body = (await request.json()) as Record<string, unknown>;
  const title = String(body.title ?? "").trim();
  const start = String(body.start ?? "").trim();
  const end = String(body.end ?? "").trim();
  if (!title || !start || !end) {
    return NextResponse.json(
      { error: "title, start, and end are required" },
      { status: 400 },
    );
  }

  try {
    const event = await createEvent(session.accessToken, {
      title,
      start,
      end,
      description:
        typeof body.description === "string"
          ? body.description
          : undefined,
      location:
        typeof body.location === "string" ? body.location : undefined,
    });
    return NextResponse.json({ event });
  } catch (error) {
    console.error("Google Calendar create error:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 },
    );
  }
}

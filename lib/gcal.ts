import { google } from "googleapis";

import type { CalendarEvent } from "@/types";

export function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}

export async function fetchWeekEvents(
  accessToken: string,
): Promise<CalendarEvent[]> {
  const calendar = getCalendarClient(accessToken);

  const now = new Date();
  const weekFromNow = new Date(now);
  weekFromNow.setDate(now.getDate() + 7);

  const calListResponse = await calendar.calendarList.list();
  const calendars = calListResponse.data.items ?? [];

  const allEventArrays = await Promise.all(
    calendars.map(async (cal) => {
      const eventsResponse = await calendar.events.list({
        calendarId: cal.id!,
        timeMin: now.toISOString(),
        timeMax: weekFromNow.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 50,
      });
      return (eventsResponse.data.items ?? []).map((event) => ({
        id: event.id!,
        title: event.summary ?? "(No title)",
        start: event.start?.dateTime ?? event.start?.date ?? "",
        end: event.end?.dateTime ?? event.end?.date ?? "",
        source: "google" as const,
        location: event.location ?? undefined,
        description: event.description ?? undefined,
      } satisfies CalendarEvent));
    }),
  );

  const allEvents = allEventArrays.flat();
  const unique = Array.from(new Map(allEvents.map((e) => [e.id, e])).values());
  return unique.sort((a, b) => a.start.localeCompare(b.start));
}

export async function createEvent(
  accessToken: string,
  event: {
    title: string;
    start: string;
    end: string;
    description?: string;
    location?: string;
  },
): Promise<CalendarEvent> {
  const calendar = getCalendarClient(accessToken);

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: event.title,
      start: { dateTime: event.start },
      end: { dateTime: event.end },
      description: event.description,
      location: event.location,
    },
  });

  return {
    id: response.data.id!,
    title: response.data.summary ?? "(No title)",
    start: response.data.start?.dateTime ?? "",
    end: response.data.end?.dateTime ?? "",
    source: "google",
  };
}

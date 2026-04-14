import { createDAVClient } from "tsdav";

import { getConfig } from "@/lib/config";
import type { CalendarEvent } from "@/types";

export async function fetchAppleCalendarEvents(): Promise<CalendarEvent[]> {
  const config = getConfig();
  if (!config.appleCaldavUsername || !config.appleCaldavPassword) {
    console.warn("[ARIA] Apple CalDAV credentials not configured — skipping");
    return [];
  }

  try {
    const client = await createDAVClient({
      serverUrl: config.appleCaldavUrl,
      credentials: {
        username: config.appleCaldavUsername,
        password: config.appleCaldavPassword,
      },
      authMethod: "Basic",
      defaultAccountType: "caldav",
    });

    const calendars = await client.fetchCalendars();

    const now = new Date();
    const weekFromNow = new Date(now);
    weekFromNow.setDate(now.getDate() + 7);

    const allEvents: CalendarEvent[] = [];

    for (const calendar of calendars) {
      const calName = calendarDisplayName(calendar);
      const objects = await client.fetchCalendarObjects({
        calendar,
        timeRange: {
          start: now.toISOString(),
          end: weekFromNow.toISOString(),
        },
      });

      for (const obj of objects) {
        const raw = typeof obj.data === "string" ? obj.data : String(obj.data ?? "");
        const parsed = parseICalFile(raw, calName);
        allEvents.push(...parsed);
      }
    }

    return allEvents.sort((a, b) => a.start.localeCompare(b.start));
  } catch (error) {
    console.error("[ARIA] Apple Calendar CalDAV error:", error);
    return [];
  }
}

function calendarDisplayName(calendar: { displayName?: string | Record<string, unknown> }): string {
  const d = calendar.displayName;
  if (typeof d === "string" && d.trim()) return d;
  return "Apple Calendar";
}

/** Split ICS into VEVENT bodies and map each to CalendarEvent (best-effort). */
function parseICalFile(icalData: string, calendarName: string): CalendarEvent[] {
  const unfolded = icalData.replace(/\r?\n[ \t]/g, "");
  const parts = unfolded.split(/BEGIN:VEVENT/gi);
  const out: CalendarEvent[] = [];
  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i] ?? "";
    const endIdx = chunk.search(/END:VEVENT/i);
    const body = endIdx === -1 ? chunk : chunk.slice(0, endIdx);
    const ev = parseICalEventBody(body, calendarName);
    if (ev) out.push(ev);
  }
  return out;
}

function parseICalEventBody(body: string, calendarName: string): CalendarEvent | null {
  try {
    const lines = body.split(/\r?\n/);
    const props: Record<string, string> = {};

    for (const line of lines) {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      const keyPart = line.substring(0, colonIdx);
      const key = keyPart.split(";")[0]?.trim();
      if (!key) continue;
      const value = line.substring(colonIdx + 1);
      props[key.toUpperCase()] = value;
    }

    const dtStart = props.DTSTART;
    const dtEnd = props.DTEND ?? props.DTSTART;
    const summary = props.SUMMARY;
    if (!dtStart) return null;

    return {
      id: props.UID ?? `apple-${calendarName}-${dtStart}-${summary ?? ""}`,
      title: summary?.trim() || "(No title)",
      start: parseICalDate(dtStart),
      end: parseICalDate(dtEnd),
      source: "apple",
      location: props.LOCATION,
      description: props.DESCRIPTION,
    };
  } catch {
    return null;
  }
}

function parseICalDate(icalDate: string): string {
  const v = icalDate.trim();
  if (v.includes("T")) {
    const m = v.match(
      /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?/,
    );
    if (m) {
      const [, y, mo, d, h, mi, s, z] = m;
      return z
        ? `${y}-${mo}-${d}T${h}:${mi}:${s}Z`
        : `${y}-${mo}-${d}T${h}:${mi}:${s}`;
    }
    return v;
  }
  const m = v.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) {
    const [, y, mo, d] = m;
    return `${y}-${mo}-${d}`;
  }
  return v;
}

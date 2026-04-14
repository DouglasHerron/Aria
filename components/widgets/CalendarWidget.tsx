"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { CalendarEvent } from "@/types";

function EventRowSkeleton() {
  return (
    <div className="flex gap-3 rounded-md border border-border/60 p-2">
      <Skeleton className="h-4 w-14 shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3 max-w-[200px]" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

function parseEventStart(iso: string): Date {
  if (iso.includes("T")) {
    return new Date(iso);
  }
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return new Date(iso);
  return new Date(y, m - 1, d);
}

function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

function formatDayHeading(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const todayKey = localDayKey(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowKey = localDayKey(tomorrow);

  if (dayKey === todayKey) return "Today";
  if (dayKey === tomorrowKey) return "Tomorrow";
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatEventTime(ev: CalendarEvent): string {
  const start = ev.start;
  if (!start.includes("T")) {
    return "All day";
  }
  const s = new Date(start);
  if (Number.isNaN(s.getTime())) return "";
  return s.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agendaNarrative, setAgendaNarrative] = useState<string | null>(null);
  const [conflictCount, setConflictCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/calendar/events");
        const data = (await res.json()) as {
          events?: CalendarEvent[];
          agendaNarrative?: string | null;
          conflicts?: unknown[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load calendar");
        }
        if (!cancelled) {
          setEvents(data.events ?? []);
          setAgendaNarrative(
            typeof data.agendaNarrative === "string" ? data.agendaNarrative : null,
          );
          setConflictCount(Array.isArray(data.conflicts) ? data.conflicts.length : 0);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      // Re-run the same load logic by forcing a refresh via fetch.
      // We keep this tiny: just refetch and reuse the existing response parsing.
      void (async () => {
        try {
          const res = await fetch("/api/calendar/events");
          const data = (await res.json()) as {
            events?: CalendarEvent[];
            agendaNarrative?: string | null;
            conflicts?: unknown[];
            error?: string;
          };
          if (!res.ok) return;
          setEvents(data.events ?? []);
          setAgendaNarrative(
            typeof data.agendaNarrative === "string" ? data.agendaNarrative : null,
          );
          setConflictCount(Array.isArray(data.conflicts) ? data.conflicts.length : 0);
        } catch {
          // ignore
        }
      })();
    };
    window.addEventListener("aria:calendar:refresh", handler as EventListener);
    return () => {
      window.removeEventListener("aria:calendar:refresh", handler as EventListener);
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const key = localDayKey(parseEventStart(ev.start));
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    }
    const keys = Array.from(map.keys()).sort();
    return keys.map((key) => ({
      key,
      label: formatDayHeading(key),
      items: (map.get(key) ?? []).sort((a, b) =>
        a.start.localeCompare(b.start),
      ),
    }));
  }, [events]);

  const todayKey = localDayKey(new Date());
  const hasEventsToday = grouped.some(
    (g) => g.key === todayKey && g.items.length > 0,
  );

  return (
    <Card className="flex min-h-[200px] flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {loading && (
          <div className="space-y-2">
            <EventRowSkeleton />
            <EventRowSkeleton />
            <EventRowSkeleton />
          </div>
        )}
        {!loading && error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {!loading && !error && agendaNarrative && (
          <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm text-foreground/90">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Today
            </p>
            <p className="mt-1 leading-relaxed">{agendaNarrative}</p>
          </div>
        )}
        {!loading && !error && conflictCount > 0 && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
            ⚠️ Schedule conflict detected ({conflictCount})
          </div>
        )}
        {!loading && !error && events.length === 0 && (
          <p className="text-sm text-muted-foreground">No events this week.</p>
        )}
        {!loading && !error && events.length > 0 && !hasEventsToday && (
          <p className="text-xs text-muted-foreground">
            No events today — showing the rest of the week.
          </p>
        )}
        {!loading && !error && events.length > 0 && (
          <ScrollArea className="h-[300px] pr-3">
            <div className="space-y-4">
              {grouped.map((group) => (
                <section key={group.key}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </h3>
                  <ul className="space-y-2">
                    {group.items.map((ev) => (
                      <li
                        key={`${ev.source}-${ev.id}`}
                        className="flex flex-wrap items-start gap-2 rounded-md border border-border/60 p-2 text-sm transition-colors hover:bg-accent/50"
                      >
                        <span className="w-16 shrink-0 text-xs text-muted-foreground">
                          {formatEventTime(ev)}
                        </span>
                        {ev.hasConflict ? (
                          <span
                            className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500"
                            aria-label="Conflicting event"
                            title="Conflicting event"
                          />
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-snug">{ev.title}</p>
                          {ev.agendaSummary ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {ev.agendaSummary}
                            </p>
                          ) : null}
                          {ev.location ? (
                            <p className="text-xs text-muted-foreground">
                              {ev.location}
                            </p>
                          ) : null}
                        </div>
                        {ev.source === "google" ? (
                          <Badge variant="secondary" className="shrink-0">
                            Google
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="shrink-0 border-amber-500/50 text-amber-600 dark:text-amber-400"
                          >
                            Apple
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

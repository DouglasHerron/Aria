"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckSquare } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ObsidianTask } from "@/types";

function localISODate(d = new Date()) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

function TaskRowSkeleton() {
  return (
    <div className="space-y-1 rounded-md border border-border/60 p-2">
      <Skeleton className="h-4 w-3/4 max-w-[240px]" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

function formatShortDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function TaskWidget() {
  const [tasks, setTasks] = useState<ObsidianTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [focusSuggestion, setFocusSuggestion] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks");
      const data = (await res.json()) as {
        tasks?: ObsidianTask[];
        focusSuggestion?: string | null;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load tasks");
      }
      setTasks(data.tasks ?? []);
      setFocusSuggestion(
        typeof data.focusSuggestion === "string" ? data.focusSuggestion : null,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const handler = () => void loadTasks();
    window.addEventListener("aria:tasks:refresh", handler as EventListener);
    return () => {
      window.removeEventListener("aria:tasks:refresh", handler as EventListener);
    };
  }, [loadTasks]);

  const today = localISODate();
  const top3 = useMemo(() => {
    return [...tasks]
      .filter((t) => typeof t.focusRank === "number" && t.focusRank >= 1 && t.focusRank <= 3)
      .sort((a, b) => (a.focusRank ?? 99) - (b.focusRank ?? 99));
  }, [tasks]);

  const remainingTasks = useMemo(() => {
    const topIds = new Set(top3.map((t) => t.id));
    return tasks.filter((t) => !topIds.has(t.id));
  }, [tasks, top3]);

  const grouped = useMemo(() => {
    const dueToday = remainingTasks.filter((t) => t.dueDate === today);
    const upcoming = remainingTasks.filter(
      (t) => t.dueDate != null && t.dueDate > today,
    );
    const noDate = remainingTasks.filter((t) => !t.dueDate);
    return { dueToday, upcoming, noDate };
  }, [remainingTasks, today]);

  async function handleMarkDone(t: ObsidianTask) {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: t.filePath,
          lineNumber: t.lineNumber,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not update task");
      }
      setTasks((prev) => prev.filter((x) => x.id !== t.id));
      toast.success("Task marked done");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    const text = newTaskText.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not create task");
      }
      setNewTaskText("");
      toast.success("Task added");
      await loadTasks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSubmitting(false);
    }
  }

  function renderTaskRow(t: ObsidianTask) {
    const score = typeof t.priorityScore === "number" ? t.priorityScore : null;
    return (
      <li
        key={t.id}
        className="flex items-start gap-2 rounded-md border border-border/60 p-2 transition-colors hover:bg-accent/50"
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug">{t.text}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t.filePath}
            {t.dueDate ? ` · ${formatShortDate(t.dueDate)}` : ""}
            {score != null ? ` · ${score}` : ""}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => void handleMarkDone(t)}
        >
          Done
        </Button>
      </li>
    );
  }

  return (
    <Card className="flex min-h-[200px] flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CheckSquare className="h-4 w-4" />
          Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {loading && (
          <div className="space-y-2">
            <TaskRowSkeleton />
            <TaskRowSkeleton />
          </div>
        )}
        {!loading && error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {!loading && !error && tasks.length === 0 && (
          <p className="text-sm text-muted-foreground">No open tasks found.</p>
        )}
        {!loading && !error && top3.length > 0 && (
          <div className="rounded-md border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Today&apos;s Focus
            </p>
            {focusSuggestion ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {focusSuggestion}
              </p>
            ) : null}
            <ol className="mt-3 space-y-2">
              {top3.map((t) => (
                <li key={t.id} className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    {t.focusRank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{t.text}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.filePath}
                      {t.dueDate ? ` · ${formatShortDate(t.dueDate)}` : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => void handleMarkDone(t)}
                  >
                    Done
                  </Button>
                </li>
              ))}
            </ol>
          </div>
        )}

        {!loading && !error && remainingTasks.length > 0 && (
          <ScrollArea className="h-[240px] pr-3">
            <div className="space-y-4 text-sm">
              {grouped.dueToday.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Due today
                  </h3>
                  <ul className="space-y-2">
                    {grouped.dueToday.map(renderTaskRow)}
                  </ul>
                </section>
              )}
              {grouped.upcoming.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Upcoming
                  </h3>
                  <ul className="space-y-2">
                    {grouped.upcoming.map(renderTaskRow)}
                  </ul>
                </section>
              )}
              {grouped.noDate.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    No date
                  </h3>
                  <ul className="space-y-2">
                    {grouped.noDate.map(renderTaskRow)}
                  </ul>
                </section>
              )}
            </div>
          </ScrollArea>
        )}
        <form
          onSubmit={(e) => void handleAddTask(e)}
          className="flex gap-2 border-t border-border/60 pt-3"
        >
          <input
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Add task…"
            className="flex h-9 min-w-0 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            disabled={submitting}
            aria-label="New task text"
          />
          <Button type="submit" size="sm" disabled={submitting}>
            Add
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmailThread } from "@/types";

type EmailCategory = "action_needed" | "fyi" | "archive";

function ThreadSkeleton() {
  return (
    <div className="space-y-2 rounded-md border border-border/60 p-3">
      <Skeleton className="h-4 w-3/4 max-w-[280px]" />
      <Skeleton className="h-3 w-1/2 max-w-[180px]" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

function formatThreadDate(dateHeader: string) {
  const parsed = new Date(dateHeader);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return dateHeader;
}

function parseFromAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  if (match?.[1]) return match[1];
  const trimmed = from.trim();
  if (trimmed.includes("@")) return trimmed;
  return "";
}

function urgencyPill(urgency: EmailThread["urgency"]) {
  if (urgency === "high")
    return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";
  if (urgency === "medium")
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  if (urgency === "low")
    return "border-border/60 bg-muted/40 text-muted-foreground";
  return "border-border/60 bg-muted/30 text-muted-foreground";
}

export function EmailWidget() {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] =
    useState<EmailCategory>("action_needed");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setEnriching(false);
      setError(null);
      try {
        const rawRes = await fetch("/api/email/threads?rawOnly=true");
        const rawData = (await rawRes.json()) as {
          threads?: EmailThread[];
          error?: string;
        };
        if (!rawRes.ok) {
          throw new Error(rawData.error ?? "Failed to load email");
        }
        if (!cancelled) {
          setThreads(rawData.threads ?? []);
          setLoading(false);
        }

        setEnriching(true);
        const res = await fetch("/api/email/threads");
        const data = (await res.json()) as {
          threads?: EmailThread[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load email");
        }
        if (!cancelled) {
          setThreads(data.threads ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setEnriching(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = threads.filter((t) => (t.category ?? "action_needed") === activeCategory);

  async function handleSend(thread: EmailThread) {
    const to = parseFromAddress(thread.from);
    if (!to) {
      toast.error("Could not determine recipient address");
      return;
    }
    const replyBody = (draftEdits[thread.id] ?? thread.draftReply ?? "").trim();
    if (!replyBody) {
      toast.error("Reply cannot be empty");
      return;
    }

    setSendingId(thread.id);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject: thread.subject,
          replyBody,
          threadId: thread.id,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to send");
      }
      toast.success("Reply sent");
      setThreads((prev) => prev.filter((t) => t.id !== thread.id));
      setExpandedId((prev) => (prev === thread.id ? null : prev));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSendingId(null);
    }
  }

  return (
    <Card className="flex min-h-[200px] flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Mail className="h-4 w-4" />
          Email
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {!loading && !error && threads.length > 0 && (
          <div className="flex gap-2">
            {(
              [
                ["action_needed", "Action Needed"],
                ["fyi", "FYI"],
                ["archive", "Archive"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveCategory(key)}
                className={
                  activeCategory === key
                    ? "rounded-md border border-border/60 bg-muted/50 px-2 py-1 text-xs font-medium"
                    : "rounded-md border border-border/60 px-2 py-1 text-xs text-muted-foreground hover:bg-muted/30"
                }
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {!loading && !error && enriching && (
          <p className="text-xs text-muted-foreground">
            Enriching threads with AI…
          </p>
        )}
        {loading && (
          <div className="space-y-2">
            <ThreadSkeleton />
            <ThreadSkeleton />
            <ThreadSkeleton />
          </div>
        )}
        {!loading && error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {!loading && !error && threads.length === 0 && (
          <p className="text-sm text-muted-foreground">No threads in inbox.</p>
        )}
        {!loading && !error && threads.length > 0 && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No threads in this category.
          </p>
        )}
        {!loading && !error && filtered.length > 0 && (
          <ScrollArea className="h-[280px] pr-3">
            <ul className="space-y-2">
              {filtered.map((t) => (
                <li
                  key={t.id}
                  className="rounded-md border border-border/60 p-3 transition-colors hover:bg-accent/50"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId((prev) => (prev === t.id ? null : t.id))
                    }
                    className="w-full cursor-pointer text-left"
                  >
                    <div className="flex items-start gap-2">
                    {t.unread && (
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500"
                        aria-hidden
                      />
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={
                            t.unread
                              ? "truncate text-sm font-semibold"
                              : "truncate text-sm font-medium text-foreground/90"
                          }
                        >
                          {t.subject}
                        </p>
                        {t.urgency ? (
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase ${urgencyPill(
                              t.urgency,
                            )}`}
                          >
                            {t.urgency}
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.from}
                      </p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {t.summary ?? t.snippet}
                      </p>
                      <p className="text-xs text-muted-foreground/80">
                        {formatThreadDate(t.date)}
                      </p>
                    </div>
                  </div>
                  </button>

                  {expandedId === t.id && (
                    <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Draft reply
                      </p>
                      <textarea
                        value={draftEdits[t.id] ?? t.draftReply ?? ""}
                        onChange={(e) =>
                          setDraftEdits((prev) => ({
                            ...prev,
                            [t.id]: e.target.value,
                          }))
                        }
                        rows={6}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="Draft reply will appear here…"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => void handleSend(t)}
                          disabled={sendingId === t.id}
                          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {sendingId === t.id ? "Sending…" : "Send"}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

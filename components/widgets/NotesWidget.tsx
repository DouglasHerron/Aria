"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ObsidianNote } from "@/types";

function NoteRowSkeleton() {
  return (
    <div className="space-y-1 rounded-md border border-border/60 p-2">
      <Skeleton className="h-4 w-3/4 max-w-[200px]" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

export function NotesWidget() {
  const [notes, setNotes] = useState<ObsidianNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchNotes = useCallback(async (q: string) => {
    setSearching(true);
    setError(null);
    try {
      const url = q.trim()
        ? `/api/notes?q=${encodeURIComponent(q.trim())}`
        : "/api/notes";
      const res = await fetch(url);
      const data = (await res.json()) as {
        notes?: ObsidianNote[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load notes");
      }
      setNotes(data.notes ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSearching(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayMs = query.trim() === "" ? 0 : 350;
    const t = window.setTimeout(() => {
      void fetchNotes(query);
    }, delayMs);
    return () => window.clearTimeout(t);
  }, [query, fetchNotes]);

  useEffect(() => {
    const onSearch = (e: Event) => {
      const detail = (e as CustomEvent<{ query?: unknown }>).detail;
      const q = typeof detail?.query === "string" ? detail.query : "";
      setQuery(q);
    };
    const onRefresh = () => void fetchNotes(query);

    window.addEventListener("aria:notes:search", onSearch as EventListener);
    window.addEventListener("aria:notes:refresh", onRefresh as EventListener);
    return () => {
      window.removeEventListener("aria:notes:search", onSearch as EventListener);
      window.removeEventListener("aria:notes:refresh", onRefresh as EventListener);
    };
  }, [fetchNotes, query]);

  const displayNotes = notes.slice(0, 5);

  async function handleCreateNote(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) {
      toast.error("Title is required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: newBody,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not create note");
      }
      setNewTitle("");
      setNewBody("");
      setDialogOpen(false);
      toast.success("Note created");
      await fetchNotes(query);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Card className="flex min-h-[200px] flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <FileText className="h-4 w-4" />
          Notes
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              New note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={(e) => void handleCreateNote(e)}>
              <DialogHeader>
                <DialogTitle>New note</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Title"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={creating}
                  aria-label="Note title"
                />
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Body (markdown)"
                  rows={5}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={creating}
                  aria-label="Note body"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search vault…"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Search notes"
        />
        {loading && (
          <div className="space-y-2">
            <NoteRowSkeleton />
            <NoteRowSkeleton />
          </div>
        )}
        {!loading && error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {!loading && !error && displayNotes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {query.trim() ? "No matching notes." : "No notes found."}
          </p>
        )}
        {!loading && !error && displayNotes.length > 0 && (
          <ScrollArea className="h-[220px] pr-3">
            <ul className="space-y-2 text-sm">
              {displayNotes.map((n) => (
                <li
                  key={n.path}
                  className="rounded-md border border-border/60 p-2 transition-colors hover:bg-accent/50"
                >
                  <p className="font-medium leading-snug">{n.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.folder === "." ? "Vault root" : n.folder}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/80">
                    {new Date(n.modified).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
        {searching && !loading && (
          <p className="text-xs text-muted-foreground">Searching…</p>
        )}
      </CardContent>
    </Card>
  );
}

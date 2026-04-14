"use client";

import { toast } from "sonner";

import { CommandPalette } from "@/components/CommandPalette";

function emit(name: string, detail?: unknown) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function CommandPaletteHost() {
  async function onAction(action: string, params: Record<string, unknown>) {
    try {
      if (action === "tasks.create") {
        const text = typeof params.text === "string" ? params.text.trim() : "";
        const dueDate =
          typeof params.dueDate === "string" ? params.dueDate : undefined;
        const tags = Array.isArray(params.tags)
          ? params.tags.filter((t): t is string => typeof t === "string")
          : undefined;
        if (!text) {
          toast.error("Task text is required");
          return;
        }
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, dueDate, tags }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Failed to create task");
        toast.success("Task created");
        emit("aria:tasks:refresh");
        return;
      }

      if (action === "notes.search") {
        const query = typeof params.query === "string" ? params.query : "";
        emit("aria:notes:search", { query });
        toast.success("Searching notes");
        return;
      }

      if (action === "notes.create") {
        const title = typeof params.title === "string" ? params.title.trim() : "";
        const content = typeof params.content === "string" ? params.content : "";
        if (!title) {
          toast.error("Note title is required");
          return;
        }
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Failed to create note");
        toast.success("Note created");
        emit("aria:notes:refresh");
        return;
      }

      if (action === "calendar.createEvent") {
        const title = typeof params.title === "string" ? params.title.trim() : "";
        const startISO =
          typeof params.startISO === "string" ? params.startISO : "";
        const endISO = typeof params.endISO === "string" ? params.endISO : "";
        const description =
          typeof params.description === "string" ? params.description : undefined;
        if (!title || !startISO || !endISO) {
          toast.error("Event title/start/end are required");
          return;
        }
        const res = await fetch("/api/calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            start: startISO,
            end: endISO,
            description,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Failed to create event");
        toast.success("Event created");
        emit("aria:calendar:refresh");
        return;
      }

      if (action === "briefing.regenerate") {
        emit("aria:briefing:regenerate");
        toast.success("Regenerating briefing");
        return;
      }

      if (action === "tasks.showTop3") {
        emit("aria:tasks:showTop3");
        toast.success("Showing top tasks");
        return;
      }

      toast.error("Unknown command");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Command failed");
    }
  }

  return <CommandPalette onAction={onAction} />;
}


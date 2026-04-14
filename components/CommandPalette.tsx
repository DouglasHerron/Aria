"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";

interface CommandPaletteProps {
  onAction: (action: string, params: Record<string, unknown>) => void;
}

type CommandResult = {
  action: string;
  params: Record<string, unknown>;
  displayMessage: string;
};

export function CommandPalette({ onAction }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const closeAndReset = useCallback(() => {
    setOpen(false);
    setInput("");
    setFeedback("");
    setLoading(false);
  }, []);

  const canSubmit = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const handleSubmit = useCallback(async () => {
    const command = input.trim();
    if (!command) return;

    setLoading(true);
    setFeedback("");
    try {
      const response = await fetch("/api/ai/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const result = (await response.json()) as CommandResult & { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Command failed");
      }

      setFeedback(result.displayMessage ?? "");
      onAction(result.action, result.params ?? {});

      window.setTimeout(() => closeAndReset(), 1200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setFeedback(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [closeAndReset, input, onAction]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setInput("");
          setFeedback("");
          setLoading(false);
        }
      }}
    >
      <Command>
        <CommandInput
          value={input}
          onValueChange={setInput}
          placeholder="Type a command… (e.g. “Add task: review PR by Friday”)"
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSubmit) void handleSubmit();
            if (e.key === "Escape") closeAndReset();
          }}
        />
        <CommandList>
          {loading ? (
            <div className="p-2 text-sm text-muted-foreground">
              Processing your command…
            </div>
          ) : feedback ? (
            <div className="p-2 text-sm text-foreground">{feedback}</div>
          ) : (
            <CommandEmpty className="p-2 text-sm text-muted-foreground">
              Press Enter to run command
            </CommandEmpty>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}


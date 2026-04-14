"use client";

import { useEffect, useState } from "react";
import { Sun } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { AIMode } from "@/types";

export function MorningBriefingWidget({ aiMode }: { aiMode: AIMode }) {
  const [briefing, setBriefing] = useState("");
  const [loading, setLoading] = useState(aiMode === "auto");
  const [error, setError] = useState("");
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (aiMode !== "auto") {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function streamBriefing() {
      setLoading(true);
      setError("");
      setBriefing("");
      try {
        const response = await fetch("/api/ai/briefing");
        if (!response.ok) throw new Error("Failed to generate briefing");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        setLoading(false);

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          setBriefing((prev) => prev + decoder.decode(value));
        }
      } catch {
        if (!cancelled) setError("Unable to generate briefing right now.");
        setLoading(false);
      }
    }

    void streamBriefing();
    return () => {
      cancelled = true;
    };
  }, [nonce, aiMode]);

  useEffect(() => {
    const handler = () => {
      setNonce((n) => n + 1);
    };
    window.addEventListener("aria:briefing:regenerate", handler as EventListener);
    return () => {
      window.removeEventListener(
        "aria:briefing:regenerate",
        handler as EventListener,
      );
    };
  }, []);

  async function generateOnce() {
    setLoading(true);
    setError("");
    setBriefing("");
    try {
      const response = await fetch("/api/ai/briefing");
      if (!response.ok) throw new Error("Failed to generate briefing");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setBriefing((prev) => prev + decoder.decode(value));
      }
    } catch {
      setError("Unable to generate briefing right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex min-h-[200px] flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Sun className="h-4 w-4" />
          Morning Briefing
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {aiMode === "off" ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              AI is currently disabled. Enable it in Settings to generate a briefing.
            </p>
          </div>
        ) : null}

        {aiMode === "on_demand" && !briefing && !loading ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Generate a briefing only when you need it.
            </p>
            <div>
              <Button type="button" size="sm" onClick={() => void generateOnce()}>
                Generate briefing
              </Button>
            </div>
          </div>
        ) : null}

        {loading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Generating your briefing</span>
              <span className="animate-pulse">...</span>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-9/12" />
            </div>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {briefing && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {briefing}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

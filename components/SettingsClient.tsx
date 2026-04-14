"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { AIMode, AIProvider } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Settings = {
  aiProvider: AIProvider;
  aiMode: AIMode;
  anthropicModel: string;
  openaiModel: string;
};

type HealthPayload = {
  status: "ok" | "degraded" | "incomplete";
  timestamp: string;
  error?: string;
  missing?: string[];
  config: {
    aiProvider: AIProvider;
    aiModel: string;
    hasAnthropicKey: boolean;
    hasOpenAIKey: boolean;
    obsidianVaultPath: string;
    hasObsidianKey: boolean;
    hasAppleCalDAV: boolean;
    demoMode: boolean;
  } | null;
};

const anthropicModels = ["claude-opus-4-6", "claude-sonnet-4-6"] as const;
const openaiModels = ["gpt-4o", "gpt-4o-mini"] as const;

export function SettingsClient({ initial }: { initial: Settings }) {
  const [settings, setSettings] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  const providerLabel =
    settings.aiProvider === "claude"
      ? "Claude"
      : settings.aiProvider === "openai"
        ? "OpenAI"
        : "Ollama";

  const activeModel = useMemo(() => {
    return settings.aiProvider === "claude"
      ? settings.anthropicModel
      : settings.aiProvider === "openai"
        ? settings.openaiModel
        : "OLLAMA_MODEL";
  }, [settings.aiProvider, settings.anthropicModel, settings.openaiModel]);

  async function refreshHealth() {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = (await res.json()) as HealthPayload;
      setHealth(data);
      setHealthError(res.ok ? null : data.error ?? "Health check failed");
    } catch (e) {
      setHealth(null);
      setHealthError(e instanceof Error ? e.message : "Health check failed");
    }
  }

  useEffect(() => {
    void refreshHealth();
  }, []);

  async function save(patch: Partial<Settings>) {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to update settings");

      const nextProvider =
        typeof patch.aiProvider === "string" ? patch.aiProvider : settings.aiProvider;
      const providerText =
        nextProvider === "claude" ? "Claude" : nextProvider === "openai" ? "OpenAI" : "Ollama";
      setSettings((prev) => ({ ...prev, ...patch }));
      toast.success(`AI provider updated → ${providerText}`);
      await refreshHealth();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  function ProviderCard({
    provider,
    title,
    subtitle,
    model,
  }: {
    provider: AIProvider;
    title: string;
    subtitle: string;
    model: string;
  }) {
    const selected = settings.aiProvider === provider;
    return (
      <button
        type="button"
        onClick={() => void save({ aiProvider: provider })}
        disabled={saving}
        className={
          selected
            ? "rounded-lg border border-border bg-muted/40 p-4 text-left ring-1 ring-ring/40 transition-colors"
            : "rounded-lg border border-border/60 p-4 text-left transition-colors hover:bg-accent/50"
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-tight">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
            <p className="mt-2 text-xs text-muted-foreground">{model}</p>
          </div>
          {selected ? (
            <span className="rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10px] font-medium">
              Selected ✓
            </span>
          ) : null}
        </div>
      </button>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Provider</CardTitle>
          <CardDescription>
            Switch between Claude, OpenAI, and local Ollama without changing code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <ProviderCard
              provider="claude"
              title="✦ Claude"
              subtitle="Anthropic"
              model={settings.anthropicModel}
            />
            <ProviderCard
              provider="openai"
              title="OpenAI"
              subtitle="OpenAI"
              model={settings.openaiModel}
            />
            <ProviderCard
              provider="ollama"
              title="Ollama (Local)"
              subtitle="Runs on your Mac"
              model="Uses OLLAMA_MODEL"
            />
          </div>

          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              AI usage mode
            </p>
            <select
              value={settings.aiMode}
              onChange={(e) => void save({ aiMode: e.target.value as AIMode })}
              disabled={saving}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="off">Off (never call AI automatically)</option>
              <option value="on_demand">On-demand (generate only when asked)</option>
              <option value="auto">Auto (generate in the background)</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Current: <span className="text-foreground">{settings.aiMode}</span>
            </p>
          </div>

          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Model
            </p>
            {settings.aiProvider === "claude" ? (
              <select
                value={settings.anthropicModel}
                onChange={(e) => void save({ anthropicModel: e.target.value })}
                disabled={saving}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {anthropicModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : settings.aiProvider === "openai" ? (
              <select
                value={settings.openaiModel}
                onChange={(e) => void save({ openaiModel: e.target.value })}
                disabled={saving}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {openaiModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                Ollama model is configured via <span className="text-foreground">OLLAMA_MODEL</span>{" "}
                in <span className="text-foreground">.env.local</span>.
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Active: <span className="text-foreground">{activeModel}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>Environment + integration readiness.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span>Anthropic API key</span>
            <span
              className={
                health?.config?.hasAnthropicKey
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }
            >
              {health?.config?.hasAnthropicKey ? "Configured" : "Missing"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>OpenAI API key</span>
            <span
              className={
                health?.config?.hasOpenAIKey
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }
            >
              {health?.config?.hasOpenAIKey ? "Configured" : "Missing"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Obsidian vault</span>
            <span className="text-muted-foreground">
              {health?.config?.obsidianVaultPath ?? "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Demo mode</span>
            <span className="text-muted-foreground">
              {health?.config?.demoMode ? "On" : "Off"}
            </span>
          </div>
          {healthError ? (
            <p className="text-xs text-destructive">{healthError}</p>
          ) : null}
          <div className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void refreshHealth()}>
              Refresh status
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Obsidian</CardTitle>
          <CardDescription>Local vault integration (read-only status here).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span>Vault path</span>
            <span className="text-muted-foreground">
              {health?.config?.obsidianVaultPath ?? "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Last checked</span>
            <span className="text-muted-foreground">
              {health?.timestamp ? new Date(health.timestamp).toLocaleString() : "—"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


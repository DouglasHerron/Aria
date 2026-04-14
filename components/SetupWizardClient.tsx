"use client";

import type { InputHTMLAttributes } from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SetupStatus = {
  allowedKeys?: string[];
  missingCore: string[];
  vercelMode?: boolean;
};

function randomBase64Secret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin);
}

function Field({
  id,
  label,
  hint,
  ...inputProps
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        {...inputProps}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

// ─── Vercel mode: read-only configuration checklist ─────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="ml-2 rounded bg-muted px-2 py-0.5 text-xs font-medium hover:bg-muted/80"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

const REQUIRED_VARS: { key: string; label: string; hint: string }[] = [
  {
    key: "NEXTAUTH_SECRET",
    label: "NEXTAUTH_SECRET",
    hint: 'Generate with: openssl rand -base64 32 (or any random 32+ character string)',
  },
  {
    key: "GOOGLE_CLIENT_ID",
    label: "GOOGLE_CLIENT_ID",
    hint: "OAuth 2.0 Client ID from Google Cloud Console",
  },
  {
    key: "GOOGLE_CLIENT_SECRET",
    label: "GOOGLE_CLIENT_SECRET",
    hint: "OAuth 2.0 Client Secret from Google Cloud Console",
  },
];

const OPTIONAL_VARS: { key: string; label: string; hint: string }[] = [
  {
    key: "ANTHROPIC_API_KEY",
    label: "ANTHROPIC_API_KEY",
    hint: "Required for AI features (email summaries, briefing, etc.)",
  },
  {
    key: "NEXTAUTH_URL",
    label: "NEXTAUTH_URL",
    hint: "Your deployment URL, e.g. https://aria-xyz.vercel.app — set this after first deploy",
  },
  {
    key: "DEMO_MODE",
    label: "DEMO_MODE",
    hint: 'Set to "true" to explore with sample data (no real credentials needed)',
  },
];

function VercelChecklist({
  missingCore,
  deploymentUrl,
}: {
  missingCore: string[];
  deploymentUrl: string;
}) {
  const callbackUri = deploymentUrl
    ? `${deploymentUrl}/api/auth/callback/google`
    : "(deploy first, then copy this URL)";

  const allConfigured = missingCore.length === 0;

  return (
    <div className="space-y-6">
      {allConfigured ? (
        <div className="rounded-md border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-900 dark:text-green-100">
          All required variables are set. If you just updated them, redeploy for changes to take effect.
        </div>
      ) : (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          <strong>Missing required variables:</strong>{" "}
          <code>{missingCore.join(", ")}</code>
          <p className="mt-1">
            Add them in{" "}
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Vercel → Project → Settings → Environment Variables
            </a>
            , then redeploy.
          </p>
        </div>
      )}

      <div className="rounded-md border bg-card p-4 space-y-4">
        <h2 className="text-base font-semibold">Required variables</h2>
        {REQUIRED_VARS.map(({ key, label, hint }) => {
          const isMissing = missingCore.includes(key);
          return (
            <div key={key} className="flex items-start gap-3">
              <span
                className={`mt-0.5 text-sm font-medium ${isMissing ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}
              >
                {isMissing ? "✗" : "✓"}
              </span>
              <div>
                <code className="text-sm font-mono">{label}</code>
                <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-md border bg-card p-4 space-y-4">
        <h2 className="text-base font-semibold">Optional variables</h2>
        {OPTIONAL_VARS.map(({ key, label, hint }) => (
          <div key={key} className="flex items-start gap-3">
            <span className="mt-0.5 text-sm font-medium text-muted-foreground">–</span>
            <div>
              <code className="text-sm font-mono">{label}</code>
              <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-md border bg-card p-4 space-y-2">
        <h2 className="text-base font-semibold">Google OAuth callback URI</h2>
        <p className="text-sm text-muted-foreground">
          Send this URI to the project owner to register it in the Google OAuth client, or add it
          yourself if you manage the Google Cloud project.
        </p>
        <div className="flex items-center gap-2 rounded bg-muted px-3 py-2 font-mono text-sm">
          <span className="break-all">{callbackUri}</span>
          {deploymentUrl && <CopyButton value={callbackUri} />}
        </div>
      </div>

      <div className="flex gap-3">
        <a
          href="https://vercel.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Open Vercel Dashboard →
        </a>
        <a
          href="/api/health"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Check health status
        </a>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function SetupWizardClient({
  isVercel = false,
  deploymentUrl = "",
}: {
  isVercel?: boolean;
  deploymentUrl?: string;
}) {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [saving, setSaving] = useState(false);

  const [nextAuthUrl, setNextAuthUrl] = useState("http://localhost:3000");
  const [nextAuthSecret, setNextAuthSecret] = useState("");
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [aiProvider, setAiProvider] = useState("claude");
  const [aiMode, setAiMode] = useState("on_demand");
  const [anthropicApiKey, setAnthropicApiKey] = useState("");
  const [anthropicModel, setAnthropicModel] = useState("claude-opus-4-6");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [openaiModel, setOpenaiModel] = useState("gpt-4o");
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState("http://127.0.0.1:11434");
  const [ollamaModel, setOllamaModel] = useState("llama3.1:8b");
  const [obsidianVaultPath, setObsidianVaultPath] = useState("");
  const [obsidianRestApiPort, setObsidianRestApiPort] = useState("27123");
  const [obsidianRestApiKey, setObsidianRestApiKey] = useState("");
  const [appleCaldavUsername, setAppleCaldavUsername] = useState("");
  const [appleCaldavPassword, setAppleCaldavPassword] = useState("");
  const [appleCaldavUrl, setAppleCaldavUrl] = useState("https://caldav.icloud.com");
  const [demoMode, setDemoMode] = useState(false);
  const [ariaUserName, setAriaUserName] = useState("");
  const [ariaUserContext, setAriaUserContext] = useState("");

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/setup", { cache: "no-store" });
      if (!res.ok) {
        setStatus(null);
        return;
      }
      const data = (await res.json()) as SetupStatus;
      setStatus(data);
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, string> = {
        NEXTAUTH_URL: nextAuthUrl.trim(),
        NEXTAUTH_SECRET: nextAuthSecret.trim(),
        GOOGLE_CLIENT_ID: googleClientId.trim(),
        GOOGLE_CLIENT_SECRET: googleClientSecret.trim(),
        AI_PROVIDER: aiProvider.trim(),
        AI_MODE: aiMode.trim(),
        ANTHROPIC_MODEL: anthropicModel.trim(),
        OPENAI_MODEL: openaiModel.trim(),
        OLLAMA_BASE_URL: ollamaBaseUrl.trim(),
        OLLAMA_MODEL: ollamaModel.trim(),
        OBSIDIAN_REST_API_PORT: obsidianRestApiPort.trim(),
        APPLE_CALDAV_URL: appleCaldavUrl.trim(),
        DEMO_MODE: demoMode ? "true" : "false",
      };
      if (anthropicApiKey.trim()) body.ANTHROPIC_API_KEY = anthropicApiKey.trim();
      if (openaiApiKey.trim()) body.OPENAI_API_KEY = openaiApiKey.trim();
      if (obsidianVaultPath.trim()) body.OBSIDIAN_VAULT_PATH = obsidianVaultPath.trim();
      if (obsidianRestApiKey.trim()) body.OBSIDIAN_REST_API_KEY = obsidianRestApiKey.trim();
      if (appleCaldavUsername.trim()) body.APPLE_CALDAV_USERNAME = appleCaldavUsername.trim();
      if (appleCaldavPassword.trim()) body.APPLE_CALDAV_PASSWORD = appleCaldavPassword.trim();
      if (ariaUserName.trim()) body.ARIA_USER_NAME = ariaUserName.trim();
      if (ariaUserContext.trim()) body.ARIA_USER_CONTEXT = ariaUserContext.trim();

      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      toast.success(data.message ?? "Saved");
      await refreshStatus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // On Vercel: show the read-only checklist (filesystem writes are not possible)
  if (isVercel) {
    return (
      <VercelChecklist
        missingCore={status?.missingCore ?? []}
        deploymentUrl={deploymentUrl}
      />
    );
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      {status?.missingCore?.length ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          Missing required keys: {status.missingCore.join(", ")}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. NextAuth & Google OAuth</CardTitle>
          <CardDescription>
            Create a project in Google Cloud Console, enable Gmail + Calendar APIs, add OAuth
            client (Web), redirect URI{" "}
            <code className="rounded bg-muted px-1 text-xs">
              http://localhost:3000/api/auth/callback/google
            </code>
            . Each clone uses its own OAuth client (not shared in git).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            id="NEXTAUTH_URL"
            label="NEXTAUTH_URL"
            value={nextAuthUrl}
            onChange={(e) => setNextAuthUrl(e.target.value)}
            autoComplete="off"
          />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="NEXTAUTH_SECRET" className="text-sm font-medium">
                NEXTAUTH_SECRET
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  setNextAuthSecret(randomBase64Secret());
                  toast.message("Generated a new secret (copy is already in the field)");
                }}
              >
                Generate
              </Button>
            </div>
            <input
              id="NEXTAUTH_SECRET"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={nextAuthSecret}
              onChange={(e) => setNextAuthSecret(e.target.value)}
              autoComplete="off"
            />
          </div>
          <Field
            id="GOOGLE_CLIENT_ID"
            label="GOOGLE_CLIENT_ID"
            value={googleClientId}
            onChange={(e) => setGoogleClientId(e.target.value)}
            autoComplete="off"
          />
          <Field
            id="GOOGLE_CLIENT_SECRET"
            label="GOOGLE_CLIENT_SECRET"
            type="password"
            value={googleClientSecret}
            onChange={(e) => setGoogleClientSecret(e.target.value)}
            autoComplete="off"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. AI provider</CardTitle>
          <CardDescription>Set keys for the provider you use in Settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="AI_PROVIDER" className="text-sm font-medium">
              AI_PROVIDER
            </label>
            <select
              id="AI_PROVIDER"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
            >
              <option value="claude">claude</option>
              <option value="openai">openai</option>
              <option value="ollama">ollama</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="AI_MODE" className="text-sm font-medium">
              AI_MODE
            </label>
            <select
              id="AI_MODE"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={aiMode}
              onChange={(e) => setAiMode(e.target.value)}
            >
              <option value="off">off</option>
              <option value="on_demand">on_demand</option>
              <option value="auto">auto</option>
            </select>
          </div>
          <Field
            id="ANTHROPIC_API_KEY"
            label="ANTHROPIC_API_KEY"
            type="password"
            value={anthropicApiKey}
            onChange={(e) => setAnthropicApiKey(e.target.value)}
            hint="Required when AI_PROVIDER=claude"
            autoComplete="off"
          />
          <Field
            id="ANTHROPIC_MODEL"
            label="ANTHROPIC_MODEL"
            value={anthropicModel}
            onChange={(e) => setAnthropicModel(e.target.value)}
            autoComplete="off"
          />
          <Field
            id="OPENAI_API_KEY"
            label="OPENAI_API_KEY"
            type="password"
            value={openaiApiKey}
            onChange={(e) => setOpenaiApiKey(e.target.value)}
            hint="Required when AI_PROVIDER=openai"
            autoComplete="off"
          />
          <Field
            id="OPENAI_MODEL"
            label="OPENAI_MODEL"
            value={openaiModel}
            onChange={(e) => setOpenaiModel(e.target.value)}
            autoComplete="off"
          />
          <Field
            id="OLLAMA_BASE_URL"
            label="OLLAMA_BASE_URL"
            value={ollamaBaseUrl}
            onChange={(e) => setOllamaBaseUrl(e.target.value)}
            autoComplete="off"
          />
          <Field
            id="OLLAMA_MODEL"
            label="OLLAMA_MODEL"
            value={ollamaModel}
            onChange={(e) => setOllamaModel(e.target.value)}
            autoComplete="off"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">3. Obsidian vault</CardTitle>
          <CardDescription>
            Absolute path to your vault. Tasks use Markdown{" "}
            <code className="rounded bg-muted px-1 text-xs">- [ ]</code> lines anywhere under that
            folder.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            id="OBSIDIAN_VAULT_PATH"
            label="OBSIDIAN_VAULT_PATH"
            value={obsidianVaultPath}
            onChange={(e) => setObsidianVaultPath(e.target.value)}
            placeholder="/absolute/path/to/your/vault"
            hint="Windows example: C:\\Users\\you\\Documents\\MyVault"
            autoComplete="off"
          />
          <Field
            id="OBSIDIAN_REST_API_PORT"
            label="OBSIDIAN_REST_API_PORT"
            value={obsidianRestApiPort}
            onChange={(e) => setObsidianRestApiPort(e.target.value)}
            autoComplete="off"
          />
          <Field
            id="OBSIDIAN_REST_API_KEY"
            label="OBSIDIAN_REST_API_KEY"
            type="password"
            value={obsidianRestApiKey}
            onChange={(e) => setObsidianRestApiKey(e.target.value)}
            autoComplete="off"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">4. Optional: Apple Calendar (CalDAV)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            id="APPLE_CALDAV_USERNAME"
            label="APPLE_CALDAV_USERNAME"
            value={appleCaldavUsername}
            onChange={(e) => setAppleCaldavUsername(e.target.value)}
            autoComplete="off"
          />
          <Field
            id="APPLE_CALDAV_PASSWORD"
            label="APPLE_CALDAV_PASSWORD (app-specific)"
            type="password"
            value={appleCaldavPassword}
            onChange={(e) => setAppleCaldavPassword(e.target.value)}
            autoComplete="off"
          />
          <Field
            id="APPLE_CALDAV_URL"
            label="APPLE_CALDAV_URL"
            value={appleCaldavUrl}
            onChange={(e) => setAppleCaldavUrl(e.target.value)}
            autoComplete="off"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">5. Profile & demo</CardTitle>
          <CardDescription>Optional personalization for AI prompts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            id="ARIA_USER_NAME"
            label="ARIA_USER_NAME"
            value={ariaUserName}
            onChange={(e) => setAriaUserName(e.target.value)}
            hint="Used in prompts and email draft sign-offs"
            autoComplete="off"
          />
          <div className="space-y-1.5">
            <label htmlFor="ARIA_USER_CONTEXT" className="text-sm font-medium">
              ARIA_USER_CONTEXT
            </label>
            <textarea
              id="ARIA_USER_CONTEXT"
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={ariaUserContext}
              onChange={(e) => setAriaUserContext(e.target.value)}
              placeholder="Short line about your role or preferences"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={demoMode}
              onChange={(e) => setDemoMode(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            DEMO_MODE (mock data, writes disabled)
          </label>
        </CardContent>
      </Card>

      <Button type="submit" disabled={saving} className="w-full sm:w-auto">
        {saving ? "Saving…" : "Save to .env.local"}
      </Button>
    </form>
  );
}

// Single source of truth for all environment configuration.
// Import getConfig() from here, never from process.env directly (except NextAuth bootstrap in lib/auth.ts).

import type { AIMode, AIProvider } from "@/types";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[ARIA Config] Missing required environment variable: ${key}\nCheck .env.local — see .env.example or complete /setup.`,
    );
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export type AppConfig = {
  nextAuthUrl: string;
  nextAuthSecret: string;
  googleClientId: string;
  googleClientSecret: string;
  aiProvider: AIProvider;
  aiMode: AIMode;
  anthropicApiKey: string;
  anthropicModel: string;
  openaiApiKey: string;
  openaiModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  obsidianVaultPath: string;
  obsidianRestApiPort: number;
  obsidianRestApiKey: string;
  appleCaldavUsername: string;
  appleCaldavPassword: string;
  appleCaldavUrl: string;
  demoMode: boolean;
  ariaUserName: string;
  ariaUserContext: string;
};

function buildConfig(): AppConfig {
  const rawAiProvider = optionalEnv("AI_PROVIDER", "claude").toLowerCase();
  const aiProvider: AIProvider =
    rawAiProvider === "openai"
      ? "openai"
      : rawAiProvider === "ollama"
        ? "ollama"
        : "claude";

  const rawAiMode = optionalEnv("AI_MODE", "on_demand").toLowerCase();
  const aiMode: AIMode =
    rawAiMode === "off" ? "off" : rawAiMode === "auto" ? "auto" : "on_demand";

  // NEXTAUTH_URL: fall back to Vercel's auto-injected deployment URL so the
  // app doesn't crash on cold start before the user sets it in the dashboard.
  // NextAuth v5 uses trustHost:true and infers the host from request headers,
  // so an empty string here is safe — sign-in will still work.
  const nextAuthUrl =
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  return {
    nextAuthUrl,
    nextAuthSecret: optionalEnv("NEXTAUTH_SECRET", ""),
    googleClientId: optionalEnv("GOOGLE_CLIENT_ID", ""),
    googleClientSecret: optionalEnv("GOOGLE_CLIENT_SECRET", ""),

    aiProvider,
    aiMode,
    anthropicApiKey: optionalEnv("ANTHROPIC_API_KEY", ""),
    anthropicModel: optionalEnv("ANTHROPIC_MODEL", "claude-opus-4-6"),
    openaiApiKey: optionalEnv("OPENAI_API_KEY", ""),
    openaiModel: optionalEnv("OPENAI_MODEL", "gpt-4o"),
    ollamaBaseUrl: optionalEnv("OLLAMA_BASE_URL", "http://127.0.0.1:11434"),
    ollamaModel: optionalEnv("OLLAMA_MODEL", "llama3.1:8b"),

    obsidianVaultPath: optionalEnv("OBSIDIAN_VAULT_PATH", "").trim(),
    obsidianRestApiPort: parseInt(
      optionalEnv("OBSIDIAN_REST_API_PORT", "27123"),
      10,
    ),
    obsidianRestApiKey: optionalEnv("OBSIDIAN_REST_API_KEY", ""),

    appleCaldavUsername: optionalEnv("APPLE_CALDAV_USERNAME", ""),
    appleCaldavPassword: optionalEnv("APPLE_CALDAV_PASSWORD", ""),
    appleCaldavUrl: optionalEnv("APPLE_CALDAV_URL", "https://caldav.icloud.com"),

    demoMode: optionalEnv("DEMO_MODE", "false") === "true",

    ariaUserName: optionalEnv("ARIA_USER_NAME", "").trim(),
    ariaUserContext: optionalEnv("ARIA_USER_CONTEXT", "").trim(),
  };
}

let configCache: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!configCache) {
    configCache = buildConfig();
  }
  return configCache;
}

/** For tests or after rewriting .env.local (normally restart the server). */
export function invalidateConfigCache(): void {
  configCache = null;
}

export function validateAIConfig(): void {
  const cfg = getConfig();
  if (cfg.aiProvider === "claude" && !cfg.anthropicApiKey) {
    throw new Error(
      "[ARIA Config] AI_PROVIDER=claude but ANTHROPIC_API_KEY is not set",
    );
  }
  if (cfg.aiProvider === "openai" && !cfg.openaiApiKey) {
    throw new Error(
      "[ARIA Config] AI_PROVIDER=openai but OPENAI_API_KEY is not set",
    );
  }
}

/** Returns the list of core required vars that are currently missing. */
export function getMissingRequiredVars(): string[] {
  const missing: string[] = [];
  if (!process.env.NEXTAUTH_SECRET) missing.push("NEXTAUTH_SECRET");
  if (!process.env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!process.env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  return missing;
}

/** True when the minimum vars needed to boot the app are all present. */
export function isCoreConfigured(): boolean {
  return getMissingRequiredVars().length === 0;
}

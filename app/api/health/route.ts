import { NextResponse } from "next/server";

import { getConfig } from "@/lib/config";
import { getMissingCoreEnvKeys } from "@/lib/env-status";
import { readSettingsFromCookies } from "@/lib/settings";

export async function GET() {
  const settings = readSettingsFromCookies();

  let config: ReturnType<typeof getConfig>;
  try {
    config = getConfig();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        status: "incomplete" as const,
        timestamp: new Date().toISOString(),
        error: message,
        missing: getMissingCoreEnvKeys(),
        config: null,
      },
      { status: 503 },
    );
  }

  let aiError: string | undefined;
  try {
    if (settings.aiProvider === "claude" && !config.anthropicApiKey) {
      throw new Error(
        "[ARIA Config] AI provider is Claude but ANTHROPIC_API_KEY is not set",
      );
    }
    if (settings.aiProvider === "openai" && !config.openaiApiKey) {
      throw new Error(
        "[ARIA Config] AI provider is OpenAI but OPENAI_API_KEY is not set",
      );
    }
  } catch (e) {
    aiError = e instanceof Error ? e.message : String(e);
  }

  const aiModel =
    settings.aiProvider === "claude"
      ? settings.anthropicModel
      : settings.aiProvider === "openai"
        ? settings.openaiModel
        : config.ollamaModel;

  const payload = {
    status: aiError ? ("degraded" as const) : ("ok" as const),
    timestamp: new Date().toISOString(),
    ...(aiError ? { error: aiError } : {}),
    config: {
      aiProvider: settings.aiProvider,
      aiModel,
      hasAnthropicKey: !!config.anthropicApiKey,
      hasOpenAIKey: !!config.openaiApiKey,
      obsidianVaultPath: config.obsidianVaultPath,
      hasObsidianKey: !!config.obsidianRestApiKey,
      hasAppleCalDAV: !!config.appleCaldavUsername,
      demoMode: config.demoMode,
    },
  };

  if (aiError) {
    return NextResponse.json(payload, { status: 503 });
  }

  return NextResponse.json(payload);
}

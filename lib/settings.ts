import { cookies } from "next/headers";

import type { AIMode, AIProvider } from "@/types";
import { getConfig } from "@/lib/config";

export type ARIASettings = {
  aiProvider: AIProvider;
  aiMode: AIMode;
  anthropicModel: string;
  openaiModel: string;
};

const COOKIE_PROVIDER = "aria_aiProvider";
const COOKIE_AI_MODE = "aria_aiMode";
const COOKIE_ANTHROPIC_MODEL = "aria_anthropicModel";
const COOKIE_OPENAI_MODEL = "aria_openaiModel";

const allowedProviders: readonly AIProvider[] = [
  "claude",
  "openai",
  "ollama",
] as const;
const allowedAIModes: readonly AIMode[] = ["off", "on_demand", "auto"] as const;
const allowedAnthropicModels = new Set(["claude-opus-4-6", "claude-sonnet-4-6"]);
const allowedOpenAIModels = new Set(["gpt-4o", "gpt-4o-mini"]);

function parseProvider(value: string | undefined): AIProvider | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  return (allowedProviders as readonly string[]).includes(lower)
    ? (lower as AIProvider)
    : null;
}

function parseAIMode(value: string | undefined): AIMode | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  return (allowedAIModes as readonly string[]).includes(lower)
    ? (lower as AIMode)
    : null;
}

function parseModel(
  value: string | undefined,
  allowed: Set<string>,
): string | null {
  if (!value) return null;
  return allowed.has(value) ? value : null;
}

function defaultSettingsFromEnv(): Pick<
  ARIASettings,
  "aiProvider" | "aiMode" | "anthropicModel" | "openaiModel"
> {
  try {
    const config = getConfig();
    return {
      aiProvider: config.aiProvider,
      aiMode: config.aiMode,
      anthropicModel: config.anthropicModel,
      openaiModel: config.openaiModel,
    };
  } catch {
    return {
      aiProvider: "claude",
      aiMode: "on_demand",
      anthropicModel: "claude-opus-4-6",
      openaiModel: "gpt-4o",
    };
  }
}

export function readSettingsFromCookies(): ARIASettings {
  const jar = cookies();
  const defaults = defaultSettingsFromEnv();

  const provider =
    parseProvider(jar.get(COOKIE_PROVIDER)?.value) ?? defaults.aiProvider;

  const aiMode = parseAIMode(jar.get(COOKIE_AI_MODE)?.value) ?? defaults.aiMode;

  const anthropicModel =
    parseModel(jar.get(COOKIE_ANTHROPIC_MODEL)?.value, allowedAnthropicModels) ??
    defaults.anthropicModel;

  const openaiModel =
    parseModel(jar.get(COOKIE_OPENAI_MODEL)?.value, allowedOpenAIModels) ??
    defaults.openaiModel;

  return {
    aiProvider: provider,
    aiMode,
    anthropicModel,
    openaiModel,
  };
}

export function validateSettingsPatch(
  patch: Partial<ARIASettings>,
): { ok: true; value: Partial<ARIASettings> } | { ok: false; error: string } {
  const next: Partial<ARIASettings> = {};

  if (patch.aiProvider !== undefined) {
    if (!allowedProviders.includes(patch.aiProvider)) {
      return { ok: false, error: "Invalid aiProvider" };
    }
    next.aiProvider = patch.aiProvider;
  }

  if (patch.aiMode !== undefined) {
    if (!allowedAIModes.includes(patch.aiMode)) {
      return { ok: false, error: "Invalid aiMode" };
    }
    next.aiMode = patch.aiMode;
  }

  if (patch.anthropicModel !== undefined) {
    if (!allowedAnthropicModels.has(patch.anthropicModel)) {
      return { ok: false, error: "Invalid anthropicModel" };
    }
    next.anthropicModel = patch.anthropicModel;
  }

  if (patch.openaiModel !== undefined) {
    if (!allowedOpenAIModels.has(patch.openaiModel)) {
      return { ok: false, error: "Invalid openaiModel" };
    }
    next.openaiModel = patch.openaiModel;
  }

  return { ok: true, value: next };
}

export const settingsCookies = {
  provider: COOKIE_PROVIDER,
  aiMode: COOKIE_AI_MODE,
  anthropicModel: COOKIE_ANTHROPIC_MODEL,
  openaiModel: COOKIE_OPENAI_MODEL,
} as const;


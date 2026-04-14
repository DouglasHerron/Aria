import { ClaudeProvider } from './providers/claude';
import { OpenAIProvider } from './providers/openai';
import { OllamaProvider } from "./providers/ollama";
import type { AIProvider } from './types';
import { getConfig } from "@/lib/config";
import { readSettingsFromCookies } from '@/lib/settings';
import { FallbackProvider } from "./providers/fallback";

export type { AIProvider, AICompletionOptions, AICompletionResult } from './types';

export function getAI(): AIProvider {
  const settings = readSettingsFromCookies();
  const config = getConfig();

  const hosted =
    settings.aiProvider === "openai"
      ? new OpenAIProvider({
          apiKey: config.openaiApiKey,
          model: settings.openaiModel,
        })
      : new ClaudeProvider({
          apiKey: config.anthropicApiKey,
          model: settings.anthropicModel,
        });

  if (settings.aiProvider === "ollama") {
    const local = new OllamaProvider({
      baseUrl: config.ollamaBaseUrl,
      model: config.ollamaModel,
    });
    return new FallbackProvider({ primary: local, secondary: hosted });
  }

  if (settings.aiProvider === 'openai') {
    return new OpenAIProvider({
      apiKey: config.openaiApiKey,
      model: settings.openaiModel,
    });
  }

  return new ClaudeProvider({
    apiKey: config.anthropicApiKey,
    model: settings.anthropicModel,
  });
}

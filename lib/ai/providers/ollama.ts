import type {
  AIProvider,
  AICompletionOptions,
  AICompletionResult,
} from "../types";

type OllamaGenerateChunk = {
  model?: string;
  response?: string;
  done?: boolean;
};

function joinUrl(baseUrl: string, path: string): string {
  const b = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function formatPrompt(options: AICompletionOptions): string {
  // Ollama's `/api/generate` has a single prompt field; combine system + prompt.
  // Keep it simple and deterministic so caching can key on this later.
  return `${options.system}\n\n${options.prompt}`.trim();
}

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;

  constructor(options: { baseUrl: string; model: string }) {
    this.baseUrl = options.baseUrl;
    this.model = options.model;
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResult> {
    const res = await fetch(joinUrl(this.baseUrl, "/api/generate"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt: formatPrompt(options),
        stream: false,
        options: {
          temperature: options.temperature,
          num_predict: options.maxTokens,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `[Ollama] ${res.status} ${res.statusText}${text ? `: ${text}` : ""}`,
      );
    }

    const data = (await res.json()) as { response?: string; model?: string };
    return {
      text: data.response ?? "",
      model: data.model ?? this.model,
      provider: "ollama",
    };
  }

  async *stream(options: AICompletionOptions): AsyncGenerator<string> {
    const res = await fetch(joinUrl(this.baseUrl, "/api/generate"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt: formatPrompt(options),
        stream: true,
        options: {
          temperature: options.temperature,
          num_predict: options.maxTokens,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `[Ollama] ${res.status} ${res.statusText}${text ? `: ${text}` : ""}`,
      );
    }

    if (!res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let chunk: OllamaGenerateChunk | null = null;
        try {
          chunk = JSON.parse(trimmed) as OllamaGenerateChunk;
        } catch {
          // ignore malformed chunk
        }

        const delta = chunk?.response;
        if (delta) yield delta;

        if (chunk?.done) return;
      }
    }
  }
}


import type { AICompletionOptions, AICompletionResult, AIProvider } from "../types";

function isLikelyNetworkError(error: unknown): boolean {
  // `fetch` failures are commonly `TypeError: fetch failed` in Node/undici.
  if (error instanceof TypeError) return true;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("ECONNREFUSED") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("EAI_AGAIN") ||
    msg.includes("ETIMEDOUT") ||
    msg.toLowerCase().includes("fetch failed")
  );
}

export class FallbackProvider implements AIProvider {
  private primary: AIProvider;
  private secondary: AIProvider;

  constructor(options: { primary: AIProvider; secondary: AIProvider }) {
    this.primary = options.primary;
    this.secondary = options.secondary;
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResult> {
    try {
      return await this.primary.complete(options);
    } catch (e) {
      if (!isLikelyNetworkError(e)) throw e;
      return await this.secondary.complete(options);
    }
  }

  async *stream(options: AICompletionOptions): AsyncGenerator<string> {
    try {
      yield* this.primary.stream(options);
      return;
    } catch (e) {
      if (!isLikelyNetworkError(e)) throw e;
    }
    yield* this.secondary.stream(options);
  }
}


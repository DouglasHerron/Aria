export interface AICompletionOptions {
  prompt: string;
  system: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionResult {
  text: string;
  model: string;
  provider: 'claude' | 'openai' | 'ollama';
  tokensUsed?: number;
}

export interface AIProvider {
  complete(options: AICompletionOptions): Promise<AICompletionResult>;
  stream(options: AICompletionOptions): AsyncGenerator<string>;
}

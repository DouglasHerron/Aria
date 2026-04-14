import OpenAI from 'openai';

import type {
  AIProvider,
  AICompletionOptions,
  AICompletionResult,
} from '../types';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(options: { apiKey: string; model: string }) {
    this.client = new OpenAI({ apiKey: options.apiKey });
    this.model = options.model;
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResult> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: options.maxTokens ?? 1024,
      messages: [
        { role: 'system', content: options.system },
        { role: 'user', content: options.prompt },
      ],
    });

    const text = response.choices[0]?.message?.content ?? '';

    return {
      text,
      model: this.model,
      provider: 'openai',
      tokensUsed: response.usage?.total_tokens,
    };
  }

  async *stream(options: AICompletionOptions): AsyncGenerator<string> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: options.maxTokens ?? 2048,
      stream: true,
      messages: [
        { role: 'system', content: options.system },
        { role: 'user', content: options.prompt },
      ],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}

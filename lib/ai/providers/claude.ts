import Anthropic from '@anthropic-ai/sdk';

import type {
  AIProvider,
  AICompletionOptions,
  AICompletionResult,
} from '../types';

export class ClaudeProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor(options: { apiKey: string; model: string }) {
    this.client = new Anthropic({ apiKey: options.apiKey });
    this.model = options.model;
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResult> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options.maxTokens ?? 1024,
      system: options.system,
      messages: [{ role: 'user', content: options.prompt }],
    });

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    return {
      text,
      model: this.model,
      provider: 'claude',
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  }

  async *stream(options: AICompletionOptions): AsyncGenerator<string> {
    const stream = await this.client.messages.stream({
      model: this.model,
      max_tokens: options.maxTokens ?? 2048,
      system: options.system,
      messages: [{ role: 'user', content: options.prompt }],
    });

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        yield chunk.delta.text;
      }
    }
  }
}

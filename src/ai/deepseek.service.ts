import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

/**
 * Cliente OpenAI-compatible apuntando a la API de DeepSeek
 * (https://api.deepseek.com). Útil para sugerencias de extracción onírica, etc.
 */
@Injectable()
export class DeepseekService {
  private readonly client: OpenAI | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('DEEPSEEK_API_KEY');
    if (!apiKey) {
      this.client = null;
      return;
    }
    const baseURL =
      this.config.get<string>('DEEPSEEK_BASE_URL') ?? 'https://api.deepseek.com';
    this.client = new OpenAI({
      apiKey,
      baseURL,
    });
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Chat completions (no streaming). Modelo por defecto: `DEEPSEEK_MODEL` o `deepseek-chat`.
   */
  async chatCompletion(
    messages: ChatCompletionMessageParam[],
    options?: { model?: string },
  ) {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'DeepSeek no está configurado: define DEEPSEEK_API_KEY en el entorno.',
      );
    }
    const model =
      options?.model ??
      this.config.get<string>('DEEPSEEK_MODEL') ??
      'deepseek-chat';
    return this.client.chat.completions.create({
      model,
      messages,
    });
  }
}

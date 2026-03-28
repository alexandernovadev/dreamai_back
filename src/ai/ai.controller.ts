import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { DeepseekService } from './deepseek.service';
import { DeepseekChatDto } from './dto/deepseek-chat.dto';

@Controller('ai/deepseek')
export class AiController {
  constructor(private readonly deepseek: DeepseekService) {}

  /** Comprueba si hay clave de API (sin llamar a DeepSeek). */
  @Get('status')
  status() {
    return {
      configured: this.deepseek.isConfigured(),
    };
  }

  /** Proxy mínimo de chat (para pruebas o el dashboard). */
  @Post('chat')
  @HttpCode(200)
  async chat(@Body() dto: DeepseekChatDto) {
    return this.deepseek.chatCompletion(
      dto.messages.map((m) => ({ role: m.role, content: m.content })),
      { model: dto.model },
    );
  }
}

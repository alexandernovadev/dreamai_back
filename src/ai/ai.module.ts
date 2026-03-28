import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { DeepseekService } from './deepseek.service';

@Module({
  controllers: [AiController],
  providers: [DeepseekService],
  exports: [DeepseekService],
})
export class AiModule {}

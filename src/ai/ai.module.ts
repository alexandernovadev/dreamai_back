import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiSuggestionsService } from './ai-suggestions.service';

@Module({
  controllers: [AiController],
  providers: [AiSuggestionsService],
  exports: [AiSuggestionsService],
})
export class AiModule {}

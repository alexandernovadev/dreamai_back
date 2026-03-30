import { Module } from '@nestjs/common';
import { AiSuggestionsService } from './ai-suggestions.service';

@Module({
  providers: [AiSuggestionsService],
  exports: [AiSuggestionsService],
})
export class AiModule {}

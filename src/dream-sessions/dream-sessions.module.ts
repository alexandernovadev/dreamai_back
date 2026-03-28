import { Module } from '@nestjs/common';
import { DreamSessionValidationService } from './dream-session-validation.service';
import { DreamSessionsController } from './dream-sessions.controller';
import { DreamSessionsService } from './dream-sessions.service';

@Module({
  controllers: [DreamSessionsController],
  providers: [DreamSessionsService, DreamSessionValidationService],
  exports: [DreamSessionsService],
})
export class DreamSessionsModule {}

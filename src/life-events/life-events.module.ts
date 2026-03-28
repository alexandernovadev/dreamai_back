import { Module } from '@nestjs/common';
import { DreamSessionsModule } from '../dream-sessions/dream-sessions.module';
import { LifeEventsController } from './life-events.controller';
import { LifeEventsService } from './life-events.service';

@Module({
  imports: [DreamSessionsModule],
  controllers: [LifeEventsController],
  providers: [LifeEventsService],
  exports: [LifeEventsService],
})
export class LifeEventsModule {}

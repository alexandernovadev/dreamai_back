import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatalogModule } from './catalog/catalog.module';
import { DreamSessionsModule } from './dream-sessions/dream-sessions.module';
import { LifeEventsModule } from './life-events/life-events.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, DreamSessionsModule, CatalogModule, LifeEventsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

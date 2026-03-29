import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './ai/ai.module';
import { CharacterModule } from './character/character.module';
import { ContextLifeModule } from './context-life/context-life.module';
import { DreamEventModule } from './dream-event/dream-event.module';
import { DreamSessionModule } from './dream-session/dream-session.module';
import { DreamObjectModule } from './dream-object/dream-object.module';
import { FeelingModule } from './feeling/feeling.module';
import { LocationModule } from './location/location.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    CloudinaryModule,
    AiModule,
    CharacterModule,
    LocationModule,
    DreamObjectModule,
    DreamEventModule,
    DreamSessionModule,
    ContextLifeModule,
    FeelingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

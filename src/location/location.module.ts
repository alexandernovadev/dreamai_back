import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DreamSession,
  DreamSessionSchema,
} from '../dream-session/schemas/dream-session.schema';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { Location, LocationSchema } from './schemas/location.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Location.name, schema: LocationSchema },
      { name: DreamSession.name, schema: DreamSessionSchema },
    ]),
  ],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}

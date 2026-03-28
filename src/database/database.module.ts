import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CatalogCharacter,
  CatalogCharacterSchema,
} from '../schemas/catalog-character.schema';
import {
  CatalogDreamObject,
  CatalogDreamObjectSchema,
} from '../schemas/catalog-object.schema';
import {
  CatalogLocation,
  CatalogLocationSchema,
} from '../schemas/catalog-location.schema';
import {
  DreamSession,
  DreamSessionSchema,
} from '../schemas/dream-session.schema';
import { LifeEvent, LifeEventSchema } from '../schemas/life-event.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => {
        const uri = process.env.DATABASE_URL?.trim();
        if (!uri) {
          throw new Error('DATABASE_URL is required');
        }
        const dbName = process.env.MONGODB_DATABASE?.trim();
        return {
          uri,
          ...(dbName ? { dbName } : {}),
        };
      },
    }),
    MongooseModule.forFeature([
      { name: CatalogCharacter.name, schema: CatalogCharacterSchema },
      { name: CatalogLocation.name, schema: CatalogLocationSchema },
      { name: CatalogDreamObject.name, schema: CatalogDreamObjectSchema },
      { name: LifeEvent.name, schema: LifeEventSchema },
      { name: DreamSession.name, schema: DreamSessionSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}

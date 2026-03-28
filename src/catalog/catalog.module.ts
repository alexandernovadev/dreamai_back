import { Module } from '@nestjs/common';
import { DreamSessionsModule } from '../dream-sessions/dream-sessions.module';
import { CatalogCharactersController } from './catalog-characters.controller';
import { CatalogCharactersService } from './catalog-characters.service';
import { CatalogLocationsController } from './catalog-locations.controller';
import { CatalogLocationsService } from './catalog-locations.service';
import { CatalogObjectsController } from './catalog-objects.controller';
import { CatalogObjectsService } from './catalog-objects.service';

@Module({
  imports: [DreamSessionsModule],
  controllers: [
    CatalogCharactersController,
    CatalogLocationsController,
    CatalogObjectsController,
  ],
  providers: [
    CatalogCharactersService,
    CatalogLocationsService,
    CatalogObjectsService,
  ],
})
export class CatalogModule {}

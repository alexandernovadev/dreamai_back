import { Controller } from '@nestjs/common';
import { CatalogBaseController } from '../common/base/catalog-base.controller';
import { CharacterService } from './character.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { QueryCharactersDto } from './dto/query-characters.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';

@Controller('characters')
export class CharacterController extends CatalogBaseController<
  CharacterService,
  CreateCharacterDto,
  UpdateCharacterDto,
  QueryCharactersDto
> {
  constructor(protected readonly service: CharacterService) {
    super();
  }
}

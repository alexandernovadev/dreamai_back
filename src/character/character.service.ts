import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DreamSession, DreamSessionDocument } from '../dream-session/schemas/dream-session.schema';
import { CatalogBaseService } from '../common/base/catalog-base.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { QueryCharactersDto } from './dto/query-characters.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { Character, CharacterDocument } from './schemas/character.schema';

@Injectable()
export class CharacterService extends CatalogBaseService {
  protected readonly entityName = 'Character';
  protected readonly dreamIdPath = 'analysis.entities.characters.characterId';

  constructor(
    @InjectModel(Character.name) protected readonly model: Model<CharacterDocument>,
    @InjectModel(DreamSession.name) protected readonly sessionModel: Model<DreamSessionDocument>,
  ) {
    super();
  }

  async create(dto: CreateCharacterDto): Promise<CharacterDocument> {
    return new this.model(dto).save();
  }

  async update(id: string, dto: UpdateCharacterDto): Promise<CharacterDocument> {
    const doc = await this.model
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
    if (!doc) throw new NotFoundException(`Character ${id} not found`);
    return doc;
  }

  protected buildFilter(query: QueryCharactersDto): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    this.applyExactOrRegex(filter, 'name', query.nameExact, query.name);
    this.applyTextField(filter, 'description', query.description);
    if (query.isKnown !== undefined) filter.isKnown = query.isKnown;
    if (query.archetype !== undefined) filter.archetype = query.archetype;
    this.applyImageFilter(filter, query.hasImage);
    this.applyDateRange(filter, 'createdAt', query.createdFrom, query.createdTo);
    this.applyDateRange(filter, 'updatedAt', query.updatedFrom, query.updatedTo);
    return filter;
  }
}

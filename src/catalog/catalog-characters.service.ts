import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CatalogCharacter } from '../schemas/catalog-character.schema';
import type { CatalogCharacterDocument } from '../schemas/catalog-character.schema';
import { CreateCatalogCharacterDto } from './dto/create-catalog-character.dto';
import { UpdateCatalogCharacterDto } from './dto/update-catalog-character.dto';

@Injectable()
export class CatalogCharactersService {
  constructor(
    @InjectModel(CatalogCharacter.name)
    private readonly model: Model<CatalogCharacterDocument>,
  ) {}

  async findAll() {
    const docs = await this.model.find().sort({ name: 1 }).exec();
    return docs.map((d) => d.toJSON());
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`CatalogCharacter ${id} not found`);
    }
    return doc.toJSON();
  }

  async create(dto: CreateCatalogCharacterDto) {
    const created = await this.model.create({
      name: dto.name,
      description: dto.description,
      isKnown: dto.isKnown ?? false,
      archetype: dto.archetype,
      imageUri: dto.imageUri,
    });
    return created.toJSON();
  }

  async update(id: string, dto: UpdateCatalogCharacterDto) {
    await this.findOne(id);
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
      .exec();
    if (!doc) {
      throw new NotFoundException(`CatalogCharacter ${id} not found`);
    }
    return doc.toJSON();
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.model.findByIdAndDelete(id).exec();
  }
}

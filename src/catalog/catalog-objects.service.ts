import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CatalogDreamObject } from '../schemas/catalog-object.schema';
import type { CatalogDreamObjectDocument } from '../schemas/catalog-object.schema';
import { CreateCatalogObjectDto } from './dto/create-catalog-object.dto';
import { UpdateCatalogObjectDto } from './dto/update-catalog-object.dto';

@Injectable()
export class CatalogObjectsService {
  constructor(
    @InjectModel(CatalogDreamObject.name)
    private readonly model: Model<CatalogDreamObjectDocument>,
  ) {}

  async findAll() {
    const docs = await this.model.find().sort({ name: 1 }).exec();
    return docs.map((d) => d.toJSON());
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`CatalogDreamObject ${id} not found`);
    }
    return doc.toJSON();
  }

  async create(dto: CreateCatalogObjectDto) {
    const created = await this.model.create({
      name: dto.name,
      description: dto.description,
      imageUri: dto.imageUri,
    });
    return created.toJSON();
  }

  async update(id: string, dto: UpdateCatalogObjectDto) {
    await this.findOne(id);
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
      .exec();
    if (!doc) {
      throw new NotFoundException(`CatalogDreamObject ${id} not found`);
    }
    return doc.toJSON();
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.model.findByIdAndDelete(id).exec();
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CatalogLocation } from '../schemas/catalog-location.schema';
import type { CatalogLocationDocument } from '../schemas/catalog-location.schema';
import { CreateCatalogLocationDto } from './dto/create-catalog-location.dto';
import { UpdateCatalogLocationDto } from './dto/update-catalog-location.dto';

@Injectable()
export class CatalogLocationsService {
  constructor(
    @InjectModel(CatalogLocation.name)
    private readonly model: Model<CatalogLocationDocument>,
  ) {}

  async findAll() {
    const docs = await this.model.find().sort({ name: 1 }).exec();
    return docs.map((d) => d.toJSON());
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`CatalogLocation ${id} not found`);
    }
    return doc.toJSON();
  }

  async create(dto: CreateCatalogLocationDto) {
    const created = await this.model.create({
      isFamiliar: dto.isFamiliar ?? false,
      setting: dto.setting,
      name: dto.name,
      description: dto.description,
      imageUri: dto.imageUri,
    });
    return created.toJSON();
  }

  async update(id: string, dto: UpdateCatalogLocationDto) {
    await this.findOne(id);
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
      .exec();
    if (!doc) {
      throw new NotFoundException(`CatalogLocation ${id} not found`);
    }
    return doc.toJSON();
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.model.findByIdAndDelete(id).exec();
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LifeEvent } from '../schemas/life-event.schema';
import type { LifeEventDocument } from '../schemas/life-event.schema';
import { CreateLifeEventDto } from './dto/create-life-event.dto';
import { UpdateLifeEventDto } from './dto/update-life-event.dto';

@Injectable()
export class LifeEventsService {
  constructor(
    @InjectModel(LifeEvent.name)
    private readonly model: Model<LifeEventDocument>,
  ) {}

  async findAll() {
    const docs = await this.model.find().sort({ createdAt: -1 }).exec();
    return docs.map((d) => d.toJSON());
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`LifeEvent ${id} not found`);
    }
    return doc.toJSON();
  }

  async create(dto: CreateLifeEventDto) {
    const created = await this.model.create({
      title: dto.title,
      note: dto.note,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
    });
    return created.toJSON();
  }

  async update(id: string, dto: UpdateLifeEventDto) {
    await this.findOne(id);
    const $set: Record<string, unknown> = {};
    if (dto.title !== undefined) {
      $set.title = dto.title;
    }
    if (dto.note !== undefined) {
      $set.note = dto.note;
    }
    if (dto.occurredAt !== undefined) {
      $set.occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : null;
    }
    const doc = await this.model
      .findByIdAndUpdate(id, { $set }, { new: true, runValidators: true })
      .exec();
    if (!doc) {
      throw new NotFoundException(`LifeEvent ${id} not found`);
    }
    return doc.toJSON();
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.model.findByIdAndDelete(id).exec();
  }
}

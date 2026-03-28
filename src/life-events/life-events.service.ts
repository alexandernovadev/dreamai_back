import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLifeEventDto } from './dto/create-life-event.dto';
import { UpdateLifeEventDto } from './dto/update-life-event.dto';

@Injectable()
export class LifeEventsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.lifeEvent.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.lifeEvent.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`LifeEvent ${id} not found`);
    }
    return row;
  }

  create(dto: CreateLifeEventDto) {
    return this.prisma.lifeEvent.create({
      data: {
        title: dto.title,
        note: dto.note,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateLifeEventDto) {
    await this.findOne(id);
    const data: Prisma.LifeEventUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title;
    }
    if (dto.note !== undefined) {
      data.note = dto.note;
    }
    if (dto.occurredAt !== undefined) {
      data.occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : null;
    }
    return this.prisma.lifeEvent.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.lifeEvent.delete({ where: { id } });
  }
}

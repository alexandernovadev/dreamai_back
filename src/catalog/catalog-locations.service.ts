import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCatalogLocationDto } from './dto/create-catalog-location.dto';
import { UpdateCatalogLocationDto } from './dto/update-catalog-location.dto';

@Injectable()
export class CatalogLocationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.catalogLocation.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.catalogLocation.findUnique({
      where: { id },
    });
    if (!row) {
      throw new NotFoundException(`CatalogLocation ${id} not found`);
    }
    return row;
  }

  create(dto: CreateCatalogLocationDto) {
    return this.prisma.catalogLocation.create({
      data: {
        isFamiliar: dto.isFamiliar ?? false,
        setting: dto.setting,
        name: dto.name,
        description: dto.description,
        imageUri: dto.imageUri,
      },
    });
  }

  async update(id: string, dto: UpdateCatalogLocationDto) {
    await this.findOne(id);
    return this.prisma.catalogLocation.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.catalogLocation.delete({
      where: { id },
    });
  }
}

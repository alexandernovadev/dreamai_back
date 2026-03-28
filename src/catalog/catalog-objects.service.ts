import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCatalogObjectDto } from './dto/create-catalog-object.dto';
import { UpdateCatalogObjectDto } from './dto/update-catalog-object.dto';

@Injectable()
export class CatalogObjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.catalogDreamObject.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.catalogDreamObject.findUnique({
      where: { id },
    });
    if (!row) {
      throw new NotFoundException(`CatalogDreamObject ${id} not found`);
    }
    return row;
  }

  create(dto: CreateCatalogObjectDto) {
    return this.prisma.catalogDreamObject.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUri: dto.imageUri,
      },
    });
  }

  async update(id: string, dto: UpdateCatalogObjectDto) {
    await this.findOne(id);
    return this.prisma.catalogDreamObject.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.catalogDreamObject.delete({
      where: { id },
    });
  }
}

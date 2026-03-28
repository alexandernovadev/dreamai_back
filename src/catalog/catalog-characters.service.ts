import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCatalogCharacterDto } from './dto/create-catalog-character.dto';
import { UpdateCatalogCharacterDto } from './dto/update-catalog-character.dto';

@Injectable()
export class CatalogCharactersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.catalogCharacter.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.catalogCharacter.findUnique({
      where: { id },
    });
    if (!row) {
      throw new NotFoundException(`CatalogCharacter ${id} not found`);
    }
    return row;
  }

  create(dto: CreateCatalogCharacterDto) {
    return this.prisma.catalogCharacter.create({
      data: {
        name: dto.name,
        description: dto.description,
        isKnown: dto.isKnown ?? false,
        archetype: dto.archetype,
        imageUri: dto.imageUri,
      },
    });
  }

  async update(id: string, dto: UpdateCatalogCharacterDto) {
    await this.findOne(id);
    return this.prisma.catalogCharacter.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.catalogCharacter.delete({
      where: { id },
    });
  }
}

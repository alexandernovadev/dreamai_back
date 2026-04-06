import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DreamSession,
  DreamSessionDocument,
} from '../dream-session/schemas/dream-session.schema';
import { CreateCharacterDto } from './dto/create-character.dto';
import { QueryCharactersDto } from './dto/query-characters.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { escapeRegex } from '../common/utils/escape-regex';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../common/constants/pagination';
import { Character, CharacterDocument } from './schemas/character.schema';

/**
 * CRUD de personajes (Character) y datos derivados.
 *
 * **Filtros en Mongo (`find` / `countDocuments`):**
 * Los filtros se arman como `Record<...>` en `buildFilter` porque incluyen operadores
 * (`$regex`, `$or`, rangos de fechas, etc.). Los tipos genéricos de Mongoose (`QueryFilter`)
 * no encajan bien con ese objeto dinámico y, con ESLint estricto, suelen marcar un tipo
 * `error`. Por eso el objeto se pasa a `.find()` / `.countDocuments()` con `as never`:
 * es la forma habitual de decirle a TypeScript “confía en este filtro”; el runtime es el
 * mismo que Mongo acepta.
 */

@Injectable()
export class CharacterService {
  constructor(
    /** Modelo Mongoose de la colección `characters`. */
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
    /** Solo se usa aquí para cruzar personajes ↔ sueños (`findOne`). */
    @InjectModel(DreamSession.name)
    private dreamSessionModel: Model<DreamSessionDocument>,
  ) {}

  /** Alta de un personaje en la colección `characters`. */
  async create(dto: CreateCharacterDto): Promise<CharacterDocument> {
    // `save()` persiste y devuelve el documento con `_id` y timestamps.
    const doc = new this.characterModel(dto);
    return doc.save();
  }

  /**
   * Lista paginada con filtros opcionales (query string).
   * `total` y `totalPages` salen de la misma condición que la página actual.
   */
  async findAll(query: QueryCharactersDto) {
    // Paginación: `page` y `limit` vienen del query string (opcionales).
    const page = query.page ?? DEFAULT_PAGE;
    const rawLimit = query.limit ?? DEFAULT_LIMIT;
    // Entre 1 y MAX_LIMIT por petición.
    const limit = Math.min(Math.max(rawLimit, 1), MAX_LIMIT);
    const filter = this.buildFilter(query);
    // Documentos a saltar antes de devolver la página actual.
    const skip = (page - 1) * limit;

    // Misma condición `filter` para lista y conteo (evita totales incoherentes).
    const [data, total] = await Promise.all([
      this.characterModel
        .find(filter as never)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.characterModel.countDocuments(filter as never).exec(),
    ]);

    // Si no hay resultados, totalPages = 0 (evita división rara).
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Un personaje por id, más **apariciones en sueños** (no persistido en Character):
   * se cruza con `dream_sessions` donde `analysis.entities.characters.characterId` coincide.
   * Ver esquema en `dream-session.schema.ts`.
   */
  async findOne(id: string) {
    const doc = await this.characterModel.findById(id).exec();
    // Sin documento en `characters` → no tiene sentido buscar sueños.
    if (!doc) {
      throw new NotFoundException(`Character ${id} not found`);
    }

    const characterId = new Types.ObjectId(id);
    const idPath = 'analysis.entities.characters.characterId';
    // ObjectId o string hex (refs desde JSON / PATCH pueden persistir como string).
    const dreamFilter = {
      $or: [{ [idPath]: characterId }, { [idPath]: characterId.toString() }],
    };

    // Lista de sueños que mencionan este personaje + cantidad (mismo filtro).
    const [dreams, count] = await Promise.all([
      this.dreamSessionModel
        .find(dreamFilter as never)
        .select({ _id: 1, timestamp: 1 })
        .sort({ timestamp: -1 })
        .lean()
        .exec(),
      this.dreamSessionModel.countDocuments(dreamFilter as never).exec(),
    ]);

    // `toObject()` convierte el documento Mongoose a POJO; añadimos el cruce calculado.
    return {
      ...doc.toObject(),
      dreamAppearances: {
        count,
        // Un renglón por sueño; `timestamp` puede faltar en datos viejos → null.
        dreams: dreams.map((d) => ({
          _id: d._id.toString(),
          timestamp: d.timestamp ?? null,
        })),
      },
    };
  }

  /** Actualización parcial (DTO con todos los campos opcionales). */
  async update(
    id: string,
    dto: UpdateCharacterDto,
  ): Promise<CharacterDocument> {
    const doc = await this.characterModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
    // `findByIdAndUpdate` devuelve null si el id no existía.
    if (!doc) {
      throw new NotFoundException(`Character ${id} not found`);
    }
    return doc;
  }

  /** Borrado por id; 404 si no existe. */
  async remove(id: string): Promise<void> {
    const res = await this.characterModel.findByIdAndDelete(id).exec();
    // null = ningún documento borrado (id inexistente).
    if (!res) {
      throw new NotFoundException(`Character ${id} not found`);
    }
  }

  /**
   * Traduce los query params permitidos a un filtro Mongo (AND implícito entre condiciones).
   * - Texto: `name` / `description` usan regex case-insensitive; el input se escapa contra regex inyectada.
   * - `hasImage`: true = tiene URL no vacía; false = sin imagen o vacía.
   * - Fechas: rangos sobre `createdAt` / `updatedAt` del documento.
   */
  private buildFilter(query: QueryCharactersDto): Record<string, unknown> {
    // Objeto que se acumula; solo entran claves que el cliente pidió filtrar.
    const filter: Record<string, unknown> = {};

    // Nombre: o bien coincide exacto (`nameExact`) o bien contiene (`name`, regex).
    if (query.nameExact !== undefined && query.nameExact.trim() !== '') {
      filter.name = query.nameExact.trim();
    } else if (query.name !== undefined && query.name.trim() !== '') {
      filter.name = {
        $regex: escapeRegex(query.name.trim()),
        $options: 'i',
      };
    }

    // Descripción: siempre búsqueda parcial (contiene), case-insensitive.
    if (query.description !== undefined && query.description.trim() !== '') {
      filter.description = {
        $regex: escapeRegex(query.description.trim()),
        $options: 'i',
      };
    }

    // Figura reconocida en vida despierta o no (boolean explícito en query).
    if (query.isKnown !== undefined) {
      filter.isKnown = query.isKnown;
    }

    // Uno de los valores del enum `CharacterArchetype`.
    if (query.archetype !== undefined) {
      filter.archetype = query.archetype;
    }

    // Filtro por presencia de imagen (opcional en query).
    if (query.hasImage === true) {
      filter.imageUri = { $exists: true, $nin: [null, ''] };
    } else if (query.hasImage === false) {
      // Cualquiera de estas condiciones = “sin imagen útil”.
      filter.$or = [
        { imageUri: { $exists: false } },
        { imageUri: null },
        { imageUri: '' },
      ];
    }

    // Rango sobre `createdAt` (Mongoose lo añade con `timestamps: true`).
    if (query.createdFrom !== undefined || query.createdTo !== undefined) {
      const range: { $gte?: Date; $lte?: Date } = {};
      if (query.createdFrom !== undefined) {
        range.$gte = new Date(query.createdFrom);
      }
      if (query.createdTo !== undefined) {
        range.$lte = new Date(query.createdTo);
      }
      filter.createdAt = range;
    }

    // Igual que arriba pero sobre `updatedAt`.
    if (query.updatedFrom !== undefined || query.updatedTo !== undefined) {
      const range: { $gte?: Date; $lte?: Date } = {};
      if (query.updatedFrom !== undefined) {
        range.$gte = new Date(query.updatedFrom);
      }
      if (query.updatedTo !== undefined) {
        range.$lte = new Date(query.updatedTo);
      }
      filter.updatedAt = range;
    }

    // Si no mandaron ningún filtro, `{}` devuelve toda la colección (más paginación en `findAll`).
    return filter;
  }
}

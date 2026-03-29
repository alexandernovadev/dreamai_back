import { PartialType } from '@nestjs/mapped-types';
import { CreateContextLifeDto } from './create-context-life.dto';

export class UpdateContextLifeDto extends PartialType(CreateContextLifeDto) {}

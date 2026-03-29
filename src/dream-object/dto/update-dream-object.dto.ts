import { PartialType } from '@nestjs/mapped-types';
import { CreateDreamObjectDto } from './create-dream-object.dto';

export class UpdateDreamObjectDto extends PartialType(CreateDreamObjectDto) {}

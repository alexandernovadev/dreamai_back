import { PartialType } from '@nestjs/mapped-types';
import { CreateDreamSessionDto } from './create-dream-session.dto';

export class UpdateDreamSessionDto extends PartialType(CreateDreamSessionDto) {}

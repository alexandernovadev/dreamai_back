import { PartialType } from '@nestjs/mapped-types';
import { CreateLifeEventDto } from './create-life-event.dto';

export class UpdateLifeEventDto extends PartialType(CreateLifeEventDto) {}

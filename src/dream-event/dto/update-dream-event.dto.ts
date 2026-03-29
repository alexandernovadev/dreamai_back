import { PartialType } from '@nestjs/mapped-types';
import { CreateDreamEventDto } from './create-dream-event.dto';

export class UpdateDreamEventDto extends PartialType(CreateDreamEventDto) {}

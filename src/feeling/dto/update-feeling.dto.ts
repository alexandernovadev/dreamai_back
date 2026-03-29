import { PartialType } from '@nestjs/mapped-types';
import { CreateFeelingDto } from './create-feeling.dto';

export class UpdateFeelingDto extends PartialType(CreateFeelingDto) {}

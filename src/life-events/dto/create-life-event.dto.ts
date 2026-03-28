import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateLifeEventDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}

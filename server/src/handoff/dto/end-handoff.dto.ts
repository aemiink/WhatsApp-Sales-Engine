import { IsDateString, IsOptional } from 'class-validator';

export class EndHandoffDto {
  @IsOptional()
  @IsDateString()
  endedAt?: string;
}

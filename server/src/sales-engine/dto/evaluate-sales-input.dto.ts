import { IsOptional, IsString } from 'class-validator';

export class EvaluateSalesInputDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  leadStage?: string;
}

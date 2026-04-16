import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpsertBrandContextDto {
  @IsOptional()
  @IsString()
  tone?: string;

  @IsOptional()
  @IsString()
  salesStyle?: string;

  @IsOptional()
  @IsObject()
  dataJson?: Record<string, unknown>;
}

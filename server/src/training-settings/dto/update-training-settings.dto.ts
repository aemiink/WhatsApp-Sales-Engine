import { Type } from 'class-transformer';
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateTrainingSettingsDto {
  @IsOptional()
  @Type(() => Object)
  @IsArray()
  productsJson?: Record<string, unknown>[];

  @IsOptional()
  @Type(() => Object)
  @IsArray()
  faqJson?: Record<string, unknown>[];

  @IsOptional()
  @IsObject()
  rulesJson?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  forbiddenResponsesJson?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  handoffRulesJson?: string[];
}

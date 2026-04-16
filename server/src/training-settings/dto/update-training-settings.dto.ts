import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateTrainingSettingsDto {
  @IsOptional()
  @IsArray()
  productsJson?: Record<string, unknown>[];

  @IsOptional()
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

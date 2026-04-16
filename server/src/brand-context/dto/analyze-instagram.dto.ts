import { IsOptional, IsString } from 'class-validator';

export class AnalyzeInstagramDto {
  @IsOptional()
  @IsString()
  instagramHandle?: string;
}

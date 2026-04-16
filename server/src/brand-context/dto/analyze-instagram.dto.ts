import { IsOptional, IsString } from 'class-validator';

export class AnalyzeInstagramDto {
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsOptional()
  @IsString()
  instagramHandle?: string;
}

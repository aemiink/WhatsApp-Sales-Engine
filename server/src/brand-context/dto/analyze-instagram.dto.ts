import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AnalyzeInstagramDto {
  @ApiPropertyOptional({
    example: 'brand_handle',
    description:
      'Preferred Instagram handle for cross-checking fetched profile username.',
  })
  @IsOptional()
  @IsString()
  instagramHandle?: string;
}

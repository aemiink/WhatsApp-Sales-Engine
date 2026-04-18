import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class AnalyzeWebsiteDto {
  @ApiProperty({
    example: 'https://example.com',
    description: 'Root URL to crawl and extract website brand signals from.',
  })
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  websiteUrl!: string;
}

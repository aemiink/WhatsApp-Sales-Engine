import { IsUrl } from 'class-validator';

export class AnalyzeWebsiteDto {
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  websiteUrl!: string;
}

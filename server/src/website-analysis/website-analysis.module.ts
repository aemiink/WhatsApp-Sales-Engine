import { Module } from '@nestjs/common';
import { WebsiteFetcherService } from './website-fetcher.service';
import { WebsiteParserService } from './website-parser.service';
import { WebsiteSignalExtractorService } from './website-signal-extractor.service';

@Module({
  providers: [
    WebsiteFetcherService,
    WebsiteParserService,
    WebsiteSignalExtractorService,
  ],
  exports: [
    WebsiteFetcherService,
    WebsiteParserService,
    WebsiteSignalExtractorService,
  ],
})
export class WebsiteAnalysisModule {}

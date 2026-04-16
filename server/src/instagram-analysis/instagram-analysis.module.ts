import { Module } from '@nestjs/common';
import { InstagramDataFetcherService } from './instagram-data-fetcher.service';
import { InstagramSignalExtractorService } from './instagram-signal-extractor.service';

@Module({
  providers: [InstagramDataFetcherService, InstagramSignalExtractorService],
  exports: [InstagramDataFetcherService, InstagramSignalExtractorService],
})
export class InstagramAnalysisModule {}

import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/app-config.module';
import { InstagramDataFetcherService } from './instagram-data-fetcher.service';
import { InstagramSignalExtractorService } from './instagram-signal-extractor.service';

@Module({
  imports: [AppConfigModule],
  providers: [InstagramDataFetcherService, InstagramSignalExtractorService],
  exports: [InstagramDataFetcherService, InstagramSignalExtractorService],
})
export class InstagramAnalysisModule {}

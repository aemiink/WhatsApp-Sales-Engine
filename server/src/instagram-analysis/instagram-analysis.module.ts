import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/app-config.module';
import { InstagramDataFetcherService } from './instagram-data-fetcher.service';
import { InstagramSignalExtractorService } from './instagram-signal-extractor.service';
import { InstagramSourceService } from './instagram-source.service';

@Module({
  imports: [AppConfigModule],
  providers: [
    InstagramSourceService,
    InstagramDataFetcherService,
    InstagramSignalExtractorService,
  ],
  exports: [
    InstagramSourceService,
    InstagramDataFetcherService,
    InstagramSignalExtractorService,
  ],
})
export class InstagramAnalysisModule {}

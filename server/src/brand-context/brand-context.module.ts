import { Module } from '@nestjs/common';
import { InstagramAnalysisModule } from '../instagram-analysis/instagram-analysis.module';
import { WebsiteAnalysisModule } from '../website-analysis/website-analysis.module';
import { BrandContextController } from './brand-context.controller';
import { BrandContextResolverService } from './brand-context-resolver.service';
import { BrandContextService } from './brand-context.service';

@Module({
  imports: [WebsiteAnalysisModule, InstagramAnalysisModule],
  controllers: [BrandContextController],
  providers: [BrandContextService, BrandContextResolverService],
  exports: [BrandContextService, BrandContextResolverService],
})
export class BrandContextModule {}

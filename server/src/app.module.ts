import { Module } from '@nestjs/common';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiBrainModule } from './ai-brain/ai-brain.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BrandContextModule } from './brand-context/brand-context.module';
import { AppConfigModule } from './config/app-config.module';
import { ConversationsModule } from './conversations/conversations.module';
import { DatabaseModule } from './database/database.module';
import { HandoffModule } from './handoff/handoff.module';
import { SalesEngineModule } from './sales-engine/sales-engine.module';
import { TrainingSettingsModule } from './training-settings/training-settings.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    ConversationsModule,
    BrandContextModule,
    AiBrainModule,
    SalesEngineModule,
    WhatsappModule,
    HandoffModule,
    AnalyticsModule,
    TrainingSettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

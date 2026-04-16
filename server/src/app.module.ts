import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiBrainModule } from './ai-brain/ai-brain.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { BrandContextModule } from './brand-context/brand-context.module';
import { CommonModule } from './common/common.module';
import { AppConfigModule } from './config/app-config.module';
import { ConversationsModule } from './conversations/conversations.module';
import { DatabaseModule } from './database/database.module';
import { ExecutionModule } from './execution/execution.module';
import { HandoffModule } from './handoff/handoff.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SalesEngineModule } from './sales-engine/sales-engine.module';
import { TrainingSettingsModule } from './training-settings/training-settings.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    AppConfigModule,
    AuthModule,
    DatabaseModule,
    CommonModule,
    ConversationsModule,
    BrandContextModule,
    AiBrainModule,
    SalesEngineModule,
    ExecutionModule,
    WhatsappModule,
    HandoffModule,
    NotificationsModule,
    AnalyticsModule,
    TrainingSettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

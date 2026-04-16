import { forwardRef, Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AppConfigModule } from '../config/app-config.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SalesEngineModule } from '../sales-engine/sales-engine.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ExecutionController } from './execution.controller';
import { AiModeService } from './services/ai-mode.service';
import { ExecutionService } from './services/execution.service';
import { HandoffExecutorService } from './services/handoff-executor.service';
import { InboundEventQueueService } from './services/inbound-event-queue.service';
import { ReplyExecutorService } from './services/reply-executor.service';

@Module({
  imports: [
    AnalyticsModule,
    AppConfigModule,
    ConversationsModule,
    NotificationsModule,
    SalesEngineModule,
    forwardRef(() => WhatsappModule),
  ],
  controllers: [ExecutionController],
  providers: [
    ExecutionService,
    ReplyExecutorService,
    HandoffExecutorService,
    AiModeService,
    InboundEventQueueService,
  ],
  exports: [
    ExecutionService,
    ReplyExecutorService,
    HandoffExecutorService,
    AiModeService,
    InboundEventQueueService,
  ],
})
export class ExecutionModule {}

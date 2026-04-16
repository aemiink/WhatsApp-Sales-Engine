import { forwardRef, Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { SalesEngineModule } from '../sales-engine/sales-engine.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ExecutionController } from './execution.controller';
import { AiModeService } from './services/ai-mode.service';
import { ExecutionService } from './services/execution.service';
import { HandoffExecutorService } from './services/handoff-executor.service';
import { ReplyExecutorService } from './services/reply-executor.service';

@Module({
  imports: [
    ConversationsModule,
    SalesEngineModule,
    forwardRef(() => WhatsappModule),
  ],
  controllers: [ExecutionController],
  providers: [
    ExecutionService,
    ReplyExecutorService,
    HandoffExecutorService,
    AiModeService,
  ],
  exports: [
    ExecutionService,
    ReplyExecutorService,
    HandoffExecutorService,
    AiModeService,
  ],
})
export class ExecutionModule {}

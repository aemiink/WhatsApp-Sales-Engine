import { forwardRef, Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AppConfigModule } from '../config/app-config.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { ExecutionModule } from '../execution/execution.module';
import { WhatsAppMessagesController } from './controllers/whatsapp-messages.controller';
import { WhatsAppWebhookController } from './controllers/whatsapp-webhook.controller';
import { MetaWhatsAppProvider } from './providers/meta-whatsapp.provider';
import { WHATSAPP_PROVIDER_TOKEN } from './providers/whatsapp-provider.interface';
import { WhatsAppConnectionService } from './services/whatsapp-connection.service';
import { WhatsAppDedupService } from './services/whatsapp-dedup.service';
import { WhatsAppMessageParserService } from './services/whatsapp-message-parser.service';
import { WhatsAppMessageSenderService } from './services/whatsapp-message-sender.service';
import { WhatsAppWebhookService } from './services/whatsapp-webhook.service';

@Module({
  imports: [
    AnalyticsModule,
    AppConfigModule,
    ConversationsModule,
    forwardRef(() => ExecutionModule),
  ],
  controllers: [WhatsAppWebhookController, WhatsAppMessagesController],
  providers: [
    WhatsAppWebhookService,
    WhatsAppMessageParserService,
    WhatsAppMessageSenderService,
    WhatsAppConnectionService,
    WhatsAppDedupService,
    MetaWhatsAppProvider,
    {
      provide: WHATSAPP_PROVIDER_TOKEN,
      useExisting: MetaWhatsAppProvider,
    },
  ],
  exports: [
    WhatsAppWebhookService,
    WhatsAppMessageSenderService,
    WhatsAppConnectionService,
    WHATSAPP_PROVIDER_TOKEN,
  ],
})
export class WhatsappModule {}

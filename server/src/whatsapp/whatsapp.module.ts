import { Module } from '@nestjs/common';
import { NoopWhatsAppProvider } from './providers/noop-whatsapp.provider';
import { WHATSAPP_PROVIDER_TOKEN } from './providers/whatsapp-provider.interface';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';

@Module({
  controllers: [WhatsappController],
  providers: [
    WhatsappService,
    NoopWhatsAppProvider,
    {
      provide: WHATSAPP_PROVIDER_TOKEN,
      useExisting: NoopWhatsAppProvider,
    },
  ],
  exports: [WhatsappService, WHATSAPP_PROVIDER_TOKEN],
})
export class WhatsappModule {}

import { Injectable } from '@nestjs/common';
import type { WhatsAppProvider } from './whatsapp-provider.interface';

@Injectable()
export class NoopWhatsAppProvider implements WhatsAppProvider {
  sendMessage(input: unknown): Promise<unknown> {
    void input;
    return Promise.reject(
      new Error(
        'WhatsApp provider implementation is not available in phase 1.',
      ),
    );
  }
}

export interface WhatsAppProvider {
  sendMessage(input: unknown): Promise<unknown>;
}

export const WHATSAPP_PROVIDER_TOKEN = 'WHATSAPP_PROVIDER_TOKEN';

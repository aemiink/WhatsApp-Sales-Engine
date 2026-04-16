export interface SendTextMessageInput {
  to: string;
  text: string;
  workspaceId?: string;
}

export interface SendTextMessageResult {
  messagingProduct: string;
  contacts: Array<{
    input: string;
    waId: string;
  }>;
  messages: Array<{
    id: string;
  }>;
  rawResponse: unknown;
}

export interface VerifyWebhookInput {
  mode?: string;
  verifyToken?: string;
  challenge?: string;
  expectedVerifyToken: string;
}

export interface VerifyWebhookResult {
  ok: boolean;
  challenge?: string;
  reason?: string;
}

export interface WhatsAppProvider {
  sendTextMessage(input: SendTextMessageInput): Promise<SendTextMessageResult>;
  verifyWebhook(input: VerifyWebhookInput): VerifyWebhookResult;
}

export const WHATSAPP_PROVIDER_TOKEN = 'WHATSAPP_PROVIDER_TOKEN';

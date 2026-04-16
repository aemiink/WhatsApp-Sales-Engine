import {
  SendTextMessageInput,
  SendTextMessageResult,
  VerifyWebhookInput,
  VerifyWebhookResult,
  WhatsAppProvider,
} from '../../src/whatsapp/providers/whatsapp-provider.interface';

export class MockWhatsAppProvider implements WhatsAppProvider {
  private failAttemptsRemaining = 0;

  readonly sentMessages: SendTextMessageInput[] = [];

  verifyResponse: VerifyWebhookResult = {
    ok: true,
    challenge: 'test-challenge',
  };

  setFailAttempts(count: number): void {
    this.failAttemptsRemaining = Math.max(0, count);
  }

  verifyWebhook(input: VerifyWebhookInput): VerifyWebhookResult {
    void input;
    return this.verifyResponse;
  }

  sendTextMessage(input: SendTextMessageInput): Promise<SendTextMessageResult> {
    if (this.failAttemptsRemaining > 0) {
      this.failAttemptsRemaining -= 1;
      return Promise.reject(new Error('Mock WhatsApp send failure'));
    }

    this.sentMessages.push(input);

    return Promise.resolve({
      messagingProduct: 'whatsapp',
      contacts: [
        {
          input: input.to,
          waId: input.to,
        },
      ],
      messages: [
        {
          id: `mock-${this.sentMessages.length}`,
        },
      ],
      rawResponse: {
        ok: true,
      },
    });
  }
}

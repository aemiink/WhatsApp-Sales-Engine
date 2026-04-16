import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { MetaApiException } from '../errors/whatsapp.errors';
import { maskPhoneNumber } from '../utils/phone-mask.util';
import {
  SendTextMessageInput,
  SendTextMessageResult,
  VerifyWebhookInput,
  VerifyWebhookResult,
  WhatsAppProvider,
} from './whatsapp-provider.interface';
import {
  ResolvedWhatsAppConnection,
  WhatsAppConnectionService,
} from '../services/whatsapp-connection.service';

interface MetaSendTextPayload {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text';
  text: {
    preview_url: boolean;
    body: string;
  };
}

interface MetaSendTextRequest {
  url: string;
  headers: {
    Authorization: string;
    'Content-Type': 'application/json';
  };
  payload: MetaSendTextPayload;
}

interface MetaSendTextResponse {
  messaging_product?: string;
  contacts?: Array<{
    input?: string;
    wa_id?: string;
  }>;
  messages?: Array<{
    id?: string;
  }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function buildMetaSendTextRequest(
  connection: ResolvedWhatsAppConnection,
  input: SendTextMessageInput,
): MetaSendTextRequest {
  return {
    url: `https://graph.facebook.com/${connection.graphApiVersion}/${connection.phoneNumberId}/messages`,
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
      'Content-Type': 'application/json',
    },
    payload: {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: input.to,
      type: 'text',
      text: {
        preview_url: false,
        body: input.text,
      },
    },
  };
}

@Injectable()
export class MetaWhatsAppProvider implements WhatsAppProvider {
  private readonly logger = new Logger(MetaWhatsAppProvider.name);

  constructor(
    private readonly connectionService: WhatsAppConnectionService,
    private readonly appConfigService: AppConfigService,
  ) {}

  verifyWebhook(input: VerifyWebhookInput): VerifyWebhookResult {
    if (input.mode !== 'subscribe') {
      return {
        ok: false,
        reason: 'hub.mode must be subscribe',
      };
    }

    if (!input.verifyToken || !input.expectedVerifyToken) {
      return {
        ok: false,
        reason: 'verify token is missing',
      };
    }

    if (input.verifyToken !== input.expectedVerifyToken) {
      return {
        ok: false,
        reason: 'verify token mismatch',
      };
    }

    if (!input.challenge) {
      return {
        ok: false,
        reason: 'hub.challenge is missing',
      };
    }

    return {
      ok: true,
      challenge: input.challenge,
    };
  }

  async sendTextMessage(
    input: SendTextMessageInput,
  ): Promise<SendTextMessageResult> {
    const connection = await this.connectionService.resolveConnection(
      input.workspaceId,
    );
    const request = buildMetaSendTextRequest(connection, input);

    this.logger.log(
      `Sending WhatsApp text message to=${maskPhoneNumber(input.to)} workspace=${input.workspaceId ?? 'global'}`,
    );

    let response: Response;
    const controller = new AbortController();
    const timeoutMs = this.appConfigService.whatsappProviderTimeoutMs ?? 12000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      response = await fetch(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(request.payload),
        signal: controller.signal,
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new MetaApiException(
          HttpStatus.GATEWAY_TIMEOUT,
          'Meta Graph API request timed out',
        );
      }

      throw new MetaApiException(
        HttpStatus.BAD_GATEWAY,
        'Failed to reach Meta Graph API',
        error,
      );
    } finally {
      clearTimeout(timeout);
    }

    const body = await this.parseResponseBody(response);

    if (!response.ok) {
      throw new MetaApiException(
        response.status as HttpStatus,
        'Meta WhatsApp API returned an error response',
        body,
      );
    }

    const parsed = this.parseSendTextResponse(body);

    this.logger.log(
      `WhatsApp message send succeeded to=${maskPhoneNumber(input.to)} messageCount=${parsed.messages.length}`,
    );

    return parsed;
  }

  private async parseResponseBody(response: Response): Promise<unknown> {
    const text = await response.text();

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return {
        raw: text,
      };
    }
  }

  private parseSendTextResponse(body: unknown): SendTextMessageResult {
    const responseBody = isRecord(body) ? (body as MetaSendTextResponse) : {};

    const contacts = Array.isArray(responseBody.contacts)
      ? responseBody.contacts
          .filter((entry) => isRecord(entry))
          .map((entry) => ({
            input: typeof entry.input === 'string' ? entry.input : '',
            waId: typeof entry.wa_id === 'string' ? entry.wa_id : '',
          }))
      : [];

    const messages = Array.isArray(responseBody.messages)
      ? responseBody.messages
          .filter((entry) => isRecord(entry))
          .map((entry) => ({
            id: typeof entry.id === 'string' ? entry.id : '',
          }))
      : [];

    return {
      messagingProduct:
        typeof responseBody.messaging_product === 'string'
          ? responseBody.messaging_product
          : 'whatsapp',
      contacts,
      messages,
      rawResponse: body,
    };
  }
}

import { HttpException, HttpStatus } from '@nestjs/common';

export enum WhatsAppErrorCode {
  MISSING_CONFIG = 'WHATSAPP_MISSING_CONFIG',
  INVALID_WEBHOOK_CHALLENGE = 'WHATSAPP_INVALID_WEBHOOK_CHALLENGE',
  INVALID_INBOUND_PAYLOAD = 'WHATSAPP_INVALID_INBOUND_PAYLOAD',
  META_API_ERROR = 'WHATSAPP_META_API_ERROR',
  CONNECTION_RESOLUTION_FAILED = 'WHATSAPP_CONNECTION_RESOLUTION_FAILED',
}

interface WhatsAppErrorBody {
  code: WhatsAppErrorCode;
  message: string;
  details?: unknown;
}

export class WhatsAppException extends HttpException {
  constructor(
    code: WhatsAppErrorCode,
    message: string,
    status: HttpStatus,
    details?: unknown,
  ) {
    const body: WhatsAppErrorBody = {
      code,
      message,
      details,
    };
    super(body, status);
  }
}

export class MissingWhatsAppConfigException extends WhatsAppException {
  constructor(message: string, details?: unknown) {
    super(
      WhatsAppErrorCode.MISSING_CONFIG,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      details,
    );
  }
}

export class InvalidWebhookChallengeException extends WhatsAppException {
  constructor(message: string, details?: unknown) {
    super(
      WhatsAppErrorCode.INVALID_WEBHOOK_CHALLENGE,
      message,
      HttpStatus.FORBIDDEN,
      details,
    );
  }
}

export class InvalidInboundPayloadException extends WhatsAppException {
  constructor(message: string, details?: unknown) {
    super(
      WhatsAppErrorCode.INVALID_INBOUND_PAYLOAD,
      message,
      HttpStatus.BAD_REQUEST,
      details,
    );
  }
}

export class MetaApiException extends WhatsAppException {
  constructor(status: HttpStatus, message: string, details?: unknown) {
    super(WhatsAppErrorCode.META_API_ERROR, message, status, details);
  }
}

export class WhatsAppConnectionResolutionException extends WhatsAppException {
  constructor(message: string, details?: unknown) {
    super(
      WhatsAppErrorCode.CONNECTION_RESOLUTION_FAILED,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      details,
    );
  }
}

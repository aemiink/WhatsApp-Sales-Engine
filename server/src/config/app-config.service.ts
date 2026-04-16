import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiDefaultProvider, EnvironmentVariables } from './env.types';

@Injectable()
export class AppConfigService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  get nodeEnv(): EnvironmentVariables['NODE_ENV'] {
    return this.configService.getOrThrow('NODE_ENV');
  }

  get port(): number {
    return this.configService.getOrThrow<number>('PORT');
  }

  get appVersion(): string {
    const value = this.configService.get<string>('APP_VERSION');
    if (value && value.length > 0) {
      return value;
    }

    return '0.0.1';
  }

  get databaseUrl(): string {
    return this.configService.getOrThrow<string>('DATABASE_URL');
  }

  get directUrl(): string {
    return this.configService.getOrThrow<string>('DIRECT_URL');
  }

  get jwtAccessSecret(): string {
    return this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  get jwtRefreshSecret(): string {
    return this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  get jwtAccessExpiresInSeconds(): number {
    return this.configService.getOrThrow<number>(
      'JWT_ACCESS_EXPIRES_IN_SECONDS',
    );
  }

  get jwtRefreshExpiresInSeconds(): number {
    return this.configService.getOrThrow<number>(
      'JWT_REFRESH_EXPIRES_IN_SECONDS',
    );
  }

  get authBypassInTest(): boolean {
    return this.configService.getOrThrow<boolean>('AUTH_BYPASS_IN_TEST');
  }

  get aiDefaultProvider(): AiDefaultProvider {
    return this.configService.getOrThrow<AiDefaultProvider>(
      'AI_DEFAULT_PROVIDER',
    );
  }

  get geminiApiKey(): string | undefined {
    const value = this.configService.get<string>('GEMINI_API_KEY');
    return value && value.length > 0 ? value : undefined;
  }

  get geminiModel(): string {
    return this.configService.getOrThrow<string>('GEMINI_MODEL');
  }

  get openAiApiKey(): string | undefined {
    const value = this.configService.get<string>('OPENAI_API_KEY');
    return value && value.length > 0 ? value : undefined;
  }

  get openAiModel(): string {
    return this.configService.getOrThrow<string>('OPENAI_MODEL');
  }

  get aiTimeoutMs(): number {
    return this.configService.getOrThrow<number>('AI_TIMEOUT_MS');
  }

  get aiMaxRetries(): number {
    return this.configService.getOrThrow<number>('AI_MAX_RETRIES');
  }

  get whatsappSendMaxRetries(): number {
    return this.configService.getOrThrow<number>('WHATSAPP_SEND_MAX_RETRIES');
  }

  get whatsappSendRetryBaseDelayMs(): number {
    return this.configService.getOrThrow<number>(
      'WHATSAPP_SEND_RETRY_BASE_DELAY_MS',
    );
  }

  get outboundMinIntervalMs(): number {
    return this.configService.getOrThrow<number>('OUTBOUND_MIN_INTERVAL_MS');
  }

  get inboundRateLimitPerWindow(): number {
    return this.configService.getOrThrow<number>(
      'INBOUND_RATE_LIMIT_PER_WINDOW',
    );
  }

  get inboundRateLimitWindowMs(): number {
    return this.configService.getOrThrow<number>(
      'INBOUND_RATE_LIMIT_WINDOW_MS',
    );
  }

  get executionQueueMaxRetries(): number {
    return this.configService.getOrThrow<number>('EXECUTION_QUEUE_MAX_RETRIES');
  }

  get executionQueueRetryBaseDelayMs(): number {
    return this.configService.getOrThrow<number>(
      'EXECUTION_QUEUE_RETRY_BASE_DELAY_MS',
    );
  }

  get whatsappAccessToken(): string {
    return this.configService.getOrThrow<string>('WHATSAPP_ACCESS_TOKEN');
  }

  get whatsappPhoneNumberId(): string {
    return this.configService.getOrThrow<string>('WHATSAPP_PHONE_NUMBER_ID');
  }

  get whatsappBusinessAccountId(): string | undefined {
    const value = this.configService.get<string>(
      'WHATSAPP_BUSINESS_ACCOUNT_ID',
    );
    return value && value.length > 0 ? value : undefined;
  }

  get whatsappWebhookVerifyToken(): string {
    return this.configService.getOrThrow<string>(
      'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
    );
  }

  get metaGraphApiVersion(): string {
    return this.configService.getOrThrow<string>('META_GRAPH_API_VERSION');
  }
}

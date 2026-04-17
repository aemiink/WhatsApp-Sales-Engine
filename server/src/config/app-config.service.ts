import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiDefaultProvider,
  AppRuntimeRole,
  EnvironmentVariables,
  QueueDriver,
} from './env.types';

@Injectable()
export class AppConfigService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  get nodeEnv(): EnvironmentVariables['NODE_ENV'] {
    return this.configService.getOrThrow('NODE_ENV');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
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

  get appRole(): AppRuntimeRole {
    return this.configService.getOrThrow<AppRuntimeRole>('APP_ROLE');
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
    return this.getBoolean('AUTH_BYPASS_IN_TEST', false);
  }

  get authAllowDevBootstrap(): boolean {
    return this.getBoolean('AUTH_ALLOW_DEV_BOOTSTRAP', false);
  }

  get authRateLimitWindowMs(): number {
    return this.configService.getOrThrow<number>('AUTH_RATE_LIMIT_WINDOW_MS');
  }

  get authRateLimitMaxRequests(): number {
    return this.configService.getOrThrow<number>(
      'AUTH_RATE_LIMIT_MAX_REQUESTS',
    );
  }

  get webhookRateLimitWindowMs(): number {
    return this.configService.getOrThrow<number>(
      'WEBHOOK_RATE_LIMIT_WINDOW_MS',
    );
  }

  get webhookRateLimitMaxRequests(): number {
    return this.configService.getOrThrow<number>(
      'WEBHOOK_RATE_LIMIT_MAX_REQUESTS',
    );
  }

  get corsAllowedOrigins(): string[] {
    const value = this.configService.getOrThrow<string>('CORS_ALLOWED_ORIGINS');

    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  get corsAllowCredentials(): boolean {
    return this.getBoolean('CORS_ALLOW_CREDENTIALS', true);
  }

  get trustProxy(): boolean {
    return this.getBoolean('TRUST_PROXY', false);
  }

  get apiRequestBodyLimit(): string {
    return this.configService.getOrThrow<string>('API_REQUEST_BODY_LIMIT');
  }

  get securityHeadersEnabled(): boolean {
    return this.getBoolean('SECURITY_HEADERS_ENABLED', true);
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

  get queueDriver(): QueueDriver {
    return this.configService.getOrThrow<QueueDriver>('QUEUE_DRIVER');
  }

  get redisUrl(): string | undefined {
    const value = this.configService.get<string>('REDIS_URL');
    return value && value.length > 0 ? value : undefined;
  }

  get queuePrefix(): string {
    return this.configService.getOrThrow<string>('QUEUE_PREFIX');
  }

  get queueInlineWorkers(): boolean {
    return this.getBoolean('QUEUE_INLINE_WORKERS', true);
  }

  get queueInboundConcurrency(): number {
    return this.configService.getOrThrow<number>('QUEUE_INBOUND_CONCURRENCY');
  }

  get queueAiDecisionConcurrency(): number {
    return this.configService.getOrThrow<number>(
      'QUEUE_AI_DECISION_CONCURRENCY',
    );
  }

  get queueOutboundConcurrency(): number {
    return this.configService.getOrThrow<number>('QUEUE_OUTBOUND_CONCURRENCY');
  }

  get queueJobRemoveOnComplete(): number {
    return this.configService.getOrThrow<number>(
      'QUEUE_JOB_REMOVE_ON_COMPLETE',
    );
  }

  get queueJobRemoveOnFail(): number {
    return this.configService.getOrThrow<number>('QUEUE_JOB_REMOVE_ON_FAIL');
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

  get whatsappAppSecret(): string | undefined {
    const value = this.configService.get<string>('WHATSAPP_APP_SECRET');
    return value && value.length > 0 ? value : undefined;
  }

  get whatsappWebhookSignatureRequired(): boolean {
    return this.getBoolean('WHATSAPP_WEBHOOK_SIGNATURE_REQUIRED', false);
  }

  get whatsappProviderTimeoutMs(): number {
    return this.configService.getOrThrow<number>(
      'WHATSAPP_PROVIDER_TIMEOUT_MS',
    );
  }

  get metaGraphApiVersion(): string {
    return this.configService.getOrThrow<string>('META_GRAPH_API_VERSION');
  }

  get websiteFetchTimeoutMs(): number {
    return this.configService.getOrThrow<number>('WEBSITE_FETCH_TIMEOUT_MS');
  }

  get websiteFetchMaxPages(): number {
    return this.configService.getOrThrow<number>('WEBSITE_FETCH_MAX_PAGES');
  }

  get websiteFetchMaxResponseBytes(): number {
    return this.configService.getOrThrow<number>(
      'WEBSITE_FETCH_MAX_RESPONSE_BYTES',
    );
  }

  get instagramAccessToken(): string | undefined {
    const value = this.configService.get<string>('INSTAGRAM_ACCESS_TOKEN');
    return value && value.length > 0 ? value : undefined;
  }

  get instagramUserId(): string | undefined {
    const value = this.configService.get<string>('INSTAGRAM_USER_ID');
    return value && value.length > 0 ? value : undefined;
  }

  get instagramGraphApiVersion(): string {
    return this.configService.getOrThrow<string>('INSTAGRAM_GRAPH_API_VERSION');
  }

  get instagramMediaLimit(): number {
    return this.configService.getOrThrow<number>('INSTAGRAM_MEDIA_LIMIT');
  }

  get instagramProviderTimeoutMs(): number {
    return this.configService.getOrThrow<number>(
      'INSTAGRAM_PROVIDER_TIMEOUT_MS',
    );
  }

  get resendApiKey(): string | undefined {
    const value = this.configService.get<string>('RESEND_API_KEY');
    return value && value.length > 0 ? value : undefined;
  }

  get emailProviderTimeoutMs(): number {
    return this.configService.getOrThrow<number>('EMAIL_PROVIDER_TIMEOUT_MS');
  }

get emailFromAddress(): string | undefined {
    const value = this.configService.get<string>('EMAIL_FROM_ADDRESS');
    if (value && value.length > 0) {
      return value;
    }

    return undefined;
  }

  get sentryDsn(): string | undefined {
    const value = this.configService.get<string>('SENTRY_DSN');
    return value && value.length > 0 ? value : undefined;
  }

  get appBaseUrl(): string {
    const value = this.configService.get<string>('APP_BASE_URL');
    if (value && value.length > 0) {
      return value;
    }

    return 'http://localhost:5173';
  }

  private getBoolean(
    key: keyof EnvironmentVariables,
    fallback: boolean,
  ): boolean {
    const value = this.configService.get<boolean | string | undefined>(key);
    if (value === undefined || value === null || value === '') {
      return fallback;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    const normalized = value.trim().toLowerCase();
    return (
      normalized === 'true' ||
      normalized === '1' ||
      normalized === 'yes' ||
      normalized === 'on'
    );
  }
}

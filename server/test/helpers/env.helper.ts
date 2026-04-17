interface TestEnvOverrides {
  [key: string]: string | undefined;
}

export function applyBaseTestEnv(overrides?: TestEnvOverrides): void {
  const defaults: TestEnvOverrides = {
    NODE_ENV: 'test',
    PORT: '3000',
    APP_VERSION: '0.0.1-test',
    APP_ROLE: 'api',
    DATABASE_URL:
      'postgresql://postgres:postgres@localhost:5432/whatsapp_sales_engine?schema=public',
    DIRECT_URL:
      'postgresql://postgres:postgres@localhost:5432/whatsapp_sales_engine?schema=public',
    JWT_ACCESS_SECRET: 'test-access-secret-value',
    JWT_REFRESH_SECRET: 'test-refresh-secret-value',
    JWT_ACCESS_EXPIRES_IN_SECONDS: '900',
    JWT_REFRESH_EXPIRES_IN_SECONDS: '604800',
    AUTH_BYPASS_IN_TEST: 'true',
    AUTH_ALLOW_DEV_BOOTSTRAP: 'false',
    AUTH_RATE_LIMIT_WINDOW_MS: '60000',
    AUTH_RATE_LIMIT_MAX_REQUESTS: '1000',
    WEBHOOK_RATE_LIMIT_WINDOW_MS: '60000',
    WEBHOOK_RATE_LIMIT_MAX_REQUESTS: '10000',
    CORS_ALLOWED_ORIGINS: 'http://localhost:5173',
    CORS_ALLOW_CREDENTIALS: 'true',
    TRUST_PROXY: 'false',
    API_REQUEST_BODY_LIMIT: '1mb',
    SECURITY_HEADERS_ENABLED: 'true',
    AI_DEFAULT_PROVIDER: 'gemini',
    GEMINI_API_KEY: 'test-gemini-key',
    GEMINI_MODEL: 'gemini-1.5-flash',
    OPENAI_MODEL: 'gpt-4o-mini',
    AI_TIMEOUT_MS: '12000',
    AI_MAX_RETRIES: '1',
    WEBSITE_FETCH_TIMEOUT_MS: '8000',
    WEBSITE_FETCH_MAX_PAGES: '4',
    WEBSITE_FETCH_MAX_RESPONSE_BYTES: '500000',
    WHATSAPP_SEND_MAX_RETRIES: '2',
    WHATSAPP_SEND_RETRY_BASE_DELAY_MS: '100',
    OUTBOUND_MIN_INTERVAL_MS: '0',
    INBOUND_RATE_LIMIT_PER_WINDOW: '1000',
    INBOUND_RATE_LIMIT_WINDOW_MS: '60000',
    EXECUTION_QUEUE_MAX_RETRIES: '2',
    EXECUTION_QUEUE_RETRY_BASE_DELAY_MS: '100',
    QUEUE_DRIVER: 'memory',
    QUEUE_PREFIX: 'wse-test',
    QUEUE_INLINE_WORKERS: 'true',
    QUEUE_INBOUND_CONCURRENCY: '2',
    QUEUE_AI_DECISION_CONCURRENCY: '2',
    QUEUE_OUTBOUND_CONCURRENCY: '2',
    QUEUE_JOB_REMOVE_ON_COMPLETE: '50',
    QUEUE_JOB_REMOVE_ON_FAIL: '50',
    WHATSAPP_ACCESS_TOKEN: 'test-wa-access-token',
    WHATSAPP_PHONE_NUMBER_ID: '123456789',
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'test-webhook-token',
    WHATSAPP_APP_SECRET: 'test-whatsapp-app-secret-value',
    WHATSAPP_WEBHOOK_SIGNATURE_REQUIRED: 'false',
    WHATSAPP_PROVIDER_TIMEOUT_MS: '12000',
    META_GRAPH_API_VERSION: 'v21.0',
    INSTAGRAM_GRAPH_API_VERSION: 'v21.0',
    INSTAGRAM_MEDIA_LIMIT: '20',
    INSTAGRAM_PROVIDER_TIMEOUT_MS: '5000',
    EMAIL_PROVIDER_TIMEOUT_MS: '10000',
  };

  const merged = {
    ...defaults,
    ...overrides,
  };

  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined) {
      continue;
    }

    process.env[key] = value;
  }
}

import { useMemo, useState } from 'react';
import {
  Play,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  MessageSquare,
  Webhook,
} from 'lucide-react';
import { ApiError } from '../lib/api/apiClient';
import {
  testWebhookPayload,
  type WebhookTestResponse,
} from '../lib/api/services';
import { PageHeader } from '../components/shared/PageHeader';

interface WebhookLog {
  id: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  summary: string;
  result?: WebhookTestResponse;
  error?: string;
}

const defaultPayload = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '123456789',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            from: '+905555555555',
            to: '123456789',
            timestamp: Date.now().toString(),
            messages: [
              {
                id: 'wamid.test',
                from: '+905555555555',
                type: 'text',
                text: {
                  body: 'Test mesajı',
                },
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
};

function summaryFromResult(result: WebhookTestResponse): string {
  return `event=${result.eventCount} processed=${result.processedCount} duplicate=${result.duplicateCount} ignored=${result.ignoredCount} error=${result.errorCount}`;
}

export function WebhookTest() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [testPayload, setTestPayload] = useState<string>(
    JSON.stringify(defaultPayload, null, 2),
  );
  const [sending, setSending] = useState(false);
  const [toolDisabled, setToolDisabled] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'failed' | null;
    message: string;
  } | null>(null);

  const latest = useMemo(() => logs[0] ?? null, [logs]);

  const sendTestWebhook = async () => {
    setSending(true);
    setTestResult(null);

    let parsedPayload: unknown;
    try {
      parsedPayload = JSON.parse(testPayload);
    } catch {
      setTestResult({
        status: 'failed',
        message: 'Geçersiz JSON formatı!',
      });
      setSending(false);
      return;
    }

    if (
      typeof parsedPayload !== 'object' ||
      parsedPayload === null ||
      Array.isArray(parsedPayload)
    ) {
      setTestResult({
        status: 'failed',
        message: 'Payload JSON object olmalı.',
      });
      setSending(false);
      return;
    }

    const startedAt = new Date().toISOString();
    const pendingLogId = `${Date.now()}`;
    setLogs((prev) => [
      {
        id: pendingLogId,
        timestamp: startedAt,
        status: 'pending',
        summary: 'Webhook test isteği gönderiliyor...',
      },
      ...prev,
    ]);

    try {
      const result = await testWebhookPayload(
        parsedPayload as Record<string, unknown>,
      );
      const ok = result.errorCount === 0;

      setLogs((prev) =>
        prev.map((item) =>
          item.id === pendingLogId
            ? {
                ...item,
                status: ok ? 'success' : 'failed',
                summary: summaryFromResult(result),
                result,
              }
            : item,
        ),
      );

      setToolDisabled(false);
      setTestResult({
        status: ok ? 'success' : 'failed',
        message: ok
          ? 'Webhook başarıyla işlendi.'
          : 'Webhook işlendi ama hata/ignore sonucu döndü. Detayları inceleyin.',
      });
    } catch (error: unknown) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Webhook testi sırasında beklenmeyen bir hata oluştu.';
      const disabled = error instanceof ApiError && error.status === 403;

      setToolDisabled(disabled);
      setLogs((prev) =>
        prev.map((item) =>
          item.id === pendingLogId
            ? {
                ...item,
                status: 'failed',
                summary: message,
                error: message,
              }
            : item,
        ),
      );

      setTestResult({
        status: 'failed',
        message: disabled
          ? 'Webhook test aracı bu ortamda kapalı.'
          : message,
      });
    } finally {
      setSending(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setTestResult(null);
  };

  const getStatusIcon = (status: WebhookLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-6xl p-6 md:p-8">
        <PageHeader
          title="Webhook Test"
          description="WhatsApp webhook payload'ını gerçek backend hattında test et"
        />

        {toolDisabled && (
          <div className="mt-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-700">
            Bu araç production/staging ortamlarında kapalıdır. Dev/test ortamında
            ve admin oturumuyla kullanılmalıdır.
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Test Payload</h3>
              <button
                onClick={sendTestWebhook}
                disabled={sending || toolDisabled}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                {sending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {sending ? 'Gönderiliyor...' : 'Test Et'}
              </button>
            </div>

            <textarea
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              className="min-h-[300px] w-full resize-none rounded-md border border-input bg-background p-4 font-mono text-sm"
              placeholder="JSON payload..."
            />

            {testResult && (
              <div
                className={`mt-4 flex items-center gap-2 rounded-md p-3 ${
                  testResult.status === 'success'
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-red-500/10 text-red-500'
                }`}
              >
                {testResult.status === 'success' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="text-sm font-medium">{testResult.message}</span>
              </div>
            )}

            {latest?.result && (
              <div className="mt-4 rounded-md border border-border bg-background/60 p-3 text-sm">
                <p className="font-medium">Son Sonuç</p>
                <p className="mt-1 text-muted-foreground">{latest.summary}</p>
                {latest.result.events.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {latest.result.events.slice(0, 3).map((event) => (
                      <div
                        key={event.dedupKey}
                        className="rounded border border-border p-2"
                      >
                        <p className="font-mono text-xs text-muted-foreground">
                          dedup: {event.dedupKey}
                        </p>
                        <p className="mt-1 text-xs">
                          type={event.normalizedEvent.eventType} phone=
                          {event.normalizedEvent.fromPhoneNumber ?? 'unknown'}
                        </p>
                        {event.normalizedEvent.textBody && (
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {event.normalizedEvent.textBody}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Webhook Logları</h3>
              <button
                onClick={clearLogs}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
              >
                <Trash2 className="h-4 w-4" />
                Temizle
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Webhook className="mx-auto h-8 w-8 opacity-50" />
                  <p className="mt-2 text-sm">Henüz webhook test logu yok</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 rounded-md border border-border p-3"
                  >
                    {getStatusIcon(log.status)}
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">Webhook Test</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString('tr-TR')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {log.summary}
                      </p>
                      {log.error && (
                        <p className="mt-1 text-sm text-red-500">{log.error}</p>
                      )}
                      <div className="mt-2 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs uppercase text-muted-foreground">
                          backend
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

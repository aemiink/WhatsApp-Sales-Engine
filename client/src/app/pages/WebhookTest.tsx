import { useState } from 'react';
import {
  Send,
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
import { PageHeader } from '../components/shared/PageHeader';
import { ErrorState, LoadingState } from '../components/shared/PageStates';

interface WebhookLog {
  id: string;
  timestamp: string;
  type: 'inbound' | 'outbound';
  status: 'success' | 'failed' | 'pending';
  phoneNumber?: string;
  message?: string;
  error?: string;
}

const mockLogs: WebhookLog[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    type: 'inbound',
    status: 'success',
    phoneNumber: '+905555555555',
    message: 'Merhaba, ürün fiyatlarını öğrenebilir miyim?',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    type: 'outbound',
    status: 'success',
    phoneNumber: '+905555555555',
    message: 'Merhaba! Size yardımcı olabilirim. Hangi ürün hakkında bilgi istediğinizi belirtir misiniz?',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    type: 'inbound',
    status: 'failed',
    phoneNumber: '+905555555556',
    message: 'Bana indirim yapıyor musunuz?',
    error: 'Webhook signature doğrulama hatası',
  },
];

export function WebhookTest() {
  const [logs, setLogs] = useState<WebhookLog[]>(mockLogs);
  const [testPayload, setTestPayload] = useState<string>(
    JSON.stringify(
      {
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
      },
      null,
      2,
    ),
  );
  const [sending, setSending] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'failed' | null;
    message: string;
  } | null>(null);

  const sendTestWebhook = async () => {
    setSending(true);
    setTestResult(null);

    try {
      const payload = JSON.parse(testPayload);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newLog: WebhookLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: 'inbound',
        status: 'success',
        phoneNumber: payload.entry?.[0]?.changes?.[0]?.value?.from,
        message: payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body,
      };

      setLogs([newLog, ...logs]);
      setTestResult({
        status: 'success',
        message: 'Webhook başarıyla tetiklendi!',
      });
    } catch {
      setTestResult({
        status: 'failed',
        message: 'Geçersiz JSON formatı!',
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
          description="WhatsApp webhooklarını test et ve izle"
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Test Payload</h3>
              <button
                onClick={sendTestWebhook}
                disabled={sending}
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
                  <p className="mt-2 text-sm">Henüz webhook logu yok</p>
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
                        <span className="font-mono text-sm">
                          {log.phoneNumber || 'Bilinmeyen'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString('tr-TR')}
                        </span>
                      </div>
                      {log.message && (
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {log.message}
                        </p>
                      )}
                      {log.error && (
                        <p className="mt-1 truncate text-sm text-red-500">
                          {log.error}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs uppercase text-muted-foreground">
                          {log.type}
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
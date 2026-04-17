import { apiRequest } from './apiClient';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export type LeadStage = 'new' | 'qualified' | 'hot' | 'lost' | 'support';
export type ConversationStatus = 'active' | 'closed';
export type AiMode = 'auto_reply' | 'suggest_only' | 'paused';
export type MessageDirection = 'inbound' | 'outbound';
export type SenderType = 'user' | 'ai' | 'human';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'received' | 'unknown';

export interface ConversationListItem {
  id: string;
  phoneNumber: string;
  leadStage: LeadStage;
  status: ConversationStatus;
  aiMode: AiMode;
  lastMessageAt: string | null;
}

export interface ConversationMessage {
  id: string;
  externalMessageId: string | null;
  senderType: SenderType;
  direction: MessageDirection;
  messageType: string;
  content: string | null;
  status: MessageStatus;
  timestamp: string | null;
  createdAt: string;
}

export interface ConversationDetail {
  id: string;
  workspaceId: string;
  phoneNumber: string;
  leadStage: LeadStage;
  status: ConversationStatus;
  aiMode: AiMode;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessage[];
}

export interface ReplyExecutionResult {
  sent: boolean;
  skipped: boolean;
  reason?: string;
}

export interface HandoffResult {
  handoffSessionId: string | null;
  aiMode: AiMode;
  alreadyActive?: boolean;
  ended?: boolean;
}

export interface BrandContextResponse {
  workspaceId: string;
  brandContext: Record<string, unknown> | null;
  sourceStatus: Record<string, unknown> | null;
  confidence: Record<string, unknown> | null;
  resolvedContext: Record<string, unknown> | null;
  lastResolvedAt: string | null;
}

export interface AnalyzeSourceResponse {
  snapshotId: string | null;
  workspaceId: string;
  confidence: number | null;
  warnings: string[];
  resolvedContext: Record<string, unknown> | null;
  sourceStatus: Record<string, unknown> | null;
  resolvedConfidence: Record<string, unknown> | null;
  lastResolvedAt: string | null;
  websiteSignals?: Record<string, unknown>;
  instagramSignals?: Record<string, unknown>;
}

export interface TrainingSettingsModel {
  workspaceId: string;
  productsJson: Record<string, unknown>[];
  faqJson: Record<string, unknown>[];
  rulesJson: Record<string, unknown>;
  forbiddenResponsesJson: string[];
  handoffRulesJson: string[];
}

export interface TrainingSettingsResponse {
  workspaceId: string;
  trainingSettings: TrainingSettingsModel;
  resolvedContext?: Record<string, unknown> | null;
  sourceStatus?: Record<string, unknown> | null;
  confidence?: Record<string, unknown> | null;
  lastResolvedAt?: string | null;
}

export interface AnalyticsOverview {
  workspaceId: string;
  totals: {
    messages: number;
    conversations: number;
  };
  rates: {
    aiResponseRate: number;
    humanTakeoverRate: number;
    conversionToHotRate: number;
  };
  avgResponseTimeSeconds: number;
  generatedAt: string;
}

export interface AnalyticsFunnel {
  workspaceId: string;
  stages: {
    new: number;
    qualified: number;
    hot: number;
    closed: number;
  };
  conversionRates: {
    newToQualified: number;
    qualifiedToHot: number;
    hotToClosed: number;
  };
  dropOffRates: {
    newToQualified: number;
    qualifiedToHot: number;
    hotToClosed: number;
  };
  generatedAt: string;
}

export interface AnalyticsConversationMetrics {
  workspaceId: string;
  totalConversations: number;
  activeConversations: number;
  closedConversations: number;
  totalMessages: number;
  avgMessagesPerConversation: number;
  avgResponseTimeSeconds: number;
  generatedAt: string;
}

export interface AnalyticsAiPerformance {
  workspaceId: string;
  counts: {
    aiDecisionCount: number;
    replySentCount: number;
    replySkippedCount: number;
    handoffStartedCount: number;
  };
  rates: {
    aiReplySuccessRate: number;
    handoffFrequency: number;
  };
  avgConfidence: number;
  generatedAt: string;
}

export interface AnalyticsEvent {
  id: string;
  workspaceId: string;
  conversationId: string | null;
  type: string;
  payloadJson: Record<string, unknown> | null;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  payload: Record<string, unknown> | null;
}

export interface NotificationsStreamCreated {
  kind: 'created';
  workspaceId: string;
  userId: string | null;
  notification: AppNotification;
}

export interface NotificationsStreamRead {
  kind: 'read';
  workspaceId: string;
  userId: string;
  notificationId: string;
}

export interface NotificationsStreamReadAll {
  kind: 'read_all';
  workspaceId: string;
  userId: string;
  updatedCount: number;
}

export type NotificationsStreamEvent =
  | NotificationsStreamCreated
  | NotificationsStreamRead
  | NotificationsStreamReadAll;

export interface ConnectionSnapshot {
  id: string;
  workspaceId: string;
  phoneNumber: string;
  phoneNumberId: string;
  businessAccountId: string | null;
  hasAccessToken: boolean;
  source: 'database' | 'environment';
  lastUpdatedAt: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ConnectionHealth {
  status: 'healthy' | 'degraded' | 'disconnected';
  checkedAt: string;
  message: string;
}

export interface ConnectionStatusResponse {
  connected: boolean;
  source: 'database' | 'environment' | 'none';
  connection: ConnectionSnapshot | null;
  health: ConnectionHealth;
}

export interface ConnectionActionResponse {
  ok: boolean;
  action: 'test' | 'reconnect' | 'remove';
  message: string;
  checkedAt: string;
  status: ConnectionStatusResponse;
}

function normalizeLeadStage(value: unknown): LeadStage {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'qualified') {
    return 'qualified';
  }
  if (normalized === 'hot') {
    return 'hot';
  }
  if (normalized === 'lost') {
    return 'lost';
  }
  if (normalized === 'support') {
    return 'support';
  }
  return 'new';
}

function normalizeConversationStatus(value: unknown): ConversationStatus {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'closed') {
    return 'closed';
  }
  return 'active';
}

function normalizeAiMode(value: unknown): AiMode {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'suggest_only') {
    return 'suggest_only';
  }
  if (normalized === 'paused') {
    return 'paused';
  }
  return 'auto_reply';
}

function normalizeMessageDirection(value: unknown): MessageDirection {
  return String(value ?? '').toLowerCase() === 'outbound'
    ? 'outbound'
    : 'inbound';
}

function normalizeSenderType(value: unknown): SenderType {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'ai') {
    return 'ai';
  }
  if (normalized === 'human') {
    return 'human';
  }
  return 'user';
}

function normalizeMessageStatus(value: unknown): MessageStatus {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'sent') {
    return 'sent';
  }
  if (normalized === 'delivered') {
    return 'delivered';
  }
  if (normalized === 'read') {
    return 'read';
  }
  if (normalized === 'received') {
    return 'received';
  }
  return 'unknown';
}

function normalizeConversationListItem(entry: unknown): ConversationListItem | null {
  if (!isRecord(entry) || typeof entry.id !== 'string') {
    return null;
  }

  return {
    id: entry.id,
    phoneNumber:
      typeof entry.phoneNumber === 'string' ? entry.phoneNumber : 'Unknown',
    leadStage: normalizeLeadStage(entry.leadStage),
    status: normalizeConversationStatus(entry.status),
    aiMode: normalizeAiMode(entry.aiMode),
    lastMessageAt:
      typeof entry.lastMessageAt === 'string' ? entry.lastMessageAt : null,
  };
}

function normalizeConversationMessage(entry: unknown): ConversationMessage | null {
  if (!isRecord(entry) || typeof entry.id !== 'string') {
    return null;
  }

  return {
    id: entry.id,
    externalMessageId:
      typeof entry.externalMessageId === 'string' ? entry.externalMessageId : null,
    senderType: normalizeSenderType(entry.senderType),
    direction: normalizeMessageDirection(entry.direction),
    messageType: typeof entry.messageType === 'string' ? entry.messageType : 'unknown',
    content: typeof entry.content === 'string' ? entry.content : null,
    status: normalizeMessageStatus(entry.status),
    timestamp: typeof entry.timestamp === 'string' ? entry.timestamp : null,
    createdAt:
      typeof entry.createdAt === 'string'
        ? entry.createdAt
        : new Date().toISOString(),
  };
}

function normalizeNotification(entry: unknown): AppNotification | null {
  if (!isRecord(entry)) {
    return null;
  }

  if (
    typeof entry.id !== 'string' ||
    typeof entry.title !== 'string' ||
    typeof entry.message !== 'string'
  ) {
    return null;
  }

  return {
    id: entry.id,
    type: typeof entry.type === 'string' ? entry.type : 'INFO',
    title: entry.title,
    message: entry.message,
    isRead: typeof entry.isRead === 'boolean' ? entry.isRead : false,
    createdAt:
      typeof entry.createdAt === 'string'
        ? entry.createdAt
        : new Date().toISOString(),
    payload: isRecord(entry.payload) ? entry.payload : null,
  };
}

function toTrainingSettingsModel(value: unknown, workspaceId: string): TrainingSettingsModel {
  const settings = isRecord(value) ? value : {};

  const productsJson = Array.isArray(settings.productsJson)
    ? settings.productsJson.filter((entry): entry is Record<string, unknown> =>
        isRecord(entry),
      )
    : [];

  const faqJson = Array.isArray(settings.faqJson)
    ? settings.faqJson.filter((entry): entry is Record<string, unknown> =>
        isRecord(entry),
      )
    : [];

  const rulesJson = isRecord(settings.rulesJson) ? settings.rulesJson : {};

  return {
    workspaceId,
    productsJson,
    faqJson,
    rulesJson,
    forbiddenResponsesJson: asStringArray(settings.forbiddenResponsesJson),
    handoffRulesJson: asStringArray(settings.handoffRulesJson),
  };
}

function toConnectionStatus(value: unknown): ConnectionStatusResponse {
  if (!isRecord(value)) {
    return {
      connected: false,
      source: 'none',
      connection: null,
      health: {
        status: 'disconnected',
        checkedAt: new Date().toISOString(),
        message: 'Connection response is invalid.',
      },
    };
  }

  const sourceValue = String(value.source ?? 'none');
  const source: ConnectionStatusResponse['source'] =
    sourceValue === 'database' || sourceValue === 'environment'
      ? sourceValue
      : 'none';

  let connection: ConnectionSnapshot | null = null;
  if (isRecord(value.connection) && typeof value.connection.id === 'string') {
    connection = {
      id: value.connection.id,
      workspaceId:
        typeof value.connection.workspaceId === 'string'
          ? value.connection.workspaceId
          : 'unknown-workspace',
      phoneNumber:
        typeof value.connection.phoneNumber === 'string'
          ? value.connection.phoneNumber
          : 'unknown',
      phoneNumberId:
        typeof value.connection.phoneNumberId === 'string'
          ? value.connection.phoneNumberId
          : 'unknown',
      businessAccountId:
        typeof value.connection.businessAccountId === 'string'
          ? value.connection.businessAccountId
          : null,
      hasAccessToken: Boolean(value.connection.hasAccessToken),
      source:
        value.connection.source === 'environment' ? 'environment' : 'database',
      lastUpdatedAt:
        typeof value.connection.lastUpdatedAt === 'string'
          ? value.connection.lastUpdatedAt
          : null,
      metadata: isRecord(value.connection.metadata)
        ? value.connection.metadata
        : null,
    };
  }

  const healthRecord = isRecord(value.health) ? value.health : {};
  const healthStatusRaw = String(healthRecord.status ?? 'disconnected');
  const healthStatus: ConnectionHealth['status'] =
    healthStatusRaw === 'healthy' || healthStatusRaw === 'degraded'
      ? healthStatusRaw
      : 'disconnected';

  return {
    connected: Boolean(value.connected),
    source,
    connection,
    health: {
      status: healthStatus,
      checkedAt:
        typeof healthRecord.checkedAt === 'string'
          ? healthRecord.checkedAt
          : new Date().toISOString(),
      message:
        typeof healthRecord.message === 'string'
          ? healthRecord.message
          : 'Connection status unavailable.',
    },
  };
}

export async function fetchConversations(): Promise<ConversationListItem[]> {
  const data = await apiRequest<unknown>('/conversations');
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((entry) => normalizeConversationListItem(entry))
    .filter((entry): entry is ConversationListItem => entry !== null);
}

export async function fetchConversationDetail(
  conversationId: string,
): Promise<ConversationDetail> {
  const data = await apiRequest<unknown>(`/conversations/${conversationId}`);

  if (!isRecord(data) || typeof data.id !== 'string') {
    throw new Error('Conversation detail response is invalid.');
  }

  const messageList = Array.isArray(data.messages)
    ? data.messages
        .map((entry) => normalizeConversationMessage(entry))
        .filter((entry): entry is ConversationMessage => entry !== null)
    : [];

  return {
    id: data.id,
    workspaceId:
      typeof data.workspaceId === 'string' ? data.workspaceId : 'unknown-workspace',
    phoneNumber: typeof data.phoneNumber === 'string' ? data.phoneNumber : 'Unknown',
    leadStage: normalizeLeadStage(data.leadStage),
    status: normalizeConversationStatus(data.status),
    aiMode: normalizeAiMode(data.aiMode),
    lastMessageAt: typeof data.lastMessageAt === 'string' ? data.lastMessageAt : null,
    createdAt:
      typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
    updatedAt:
      typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
    messages: messageList,
  };
}

export async function sendManualMessage(
  conversationId: string,
  text: string,
): Promise<ReplyExecutionResult> {
  return apiRequest<ReplyExecutionResult>(`/conversations/${conversationId}/send`, {
    method: 'POST',
    body: { text },
  });
}

export async function updateConversationAiMode(
  conversationId: string,
  mode: AiMode,
): Promise<{ conversationId: string; mode: AiMode }> {
  const data = await apiRequest<unknown>(`/conversations/${conversationId}/ai-mode`, {
    method: 'PATCH',
    body: { mode },
  });

  if (!isRecord(data)) {
    return { conversationId, mode };
  }

  return {
    conversationId:
      typeof data.conversationId === 'string' ? data.conversationId : conversationId,
    mode: normalizeAiMode(data.mode),
  };
}

export async function startConversationHandoff(
  conversationId: string,
  reason: string,
): Promise<HandoffResult> {
  const data = await apiRequest<unknown>(`/conversations/${conversationId}/handoff`, {
    method: 'POST',
    body: { reason },
  });

  if (!isRecord(data)) {
    return {
      handoffSessionId: null,
      aiMode: 'paused',
      alreadyActive: false,
    };
  }

  return {
    handoffSessionId:
      typeof data.handoffSessionId === 'string' ? data.handoffSessionId : null,
    aiMode: normalizeAiMode(data.aiMode),
    alreadyActive: Boolean(data.alreadyActive),
  };
}

export async function endConversationHandoff(
  conversationId: string,
  resumeMode: AiMode,
): Promise<HandoffResult> {
  const data = await apiRequest<unknown>(`/conversations/${conversationId}/handoff/end`, {
    method: 'POST',
    body: { resumeMode },
  });

  if (!isRecord(data)) {
    return {
      handoffSessionId: null,
      aiMode: resumeMode,
      ended: false,
    };
  }

  return {
    handoffSessionId:
      typeof data.handoffSessionId === 'string' ? data.handoffSessionId : null,
    aiMode: normalizeAiMode(data.aiMode),
    ended: Boolean(data.ended),
  };
}

export async function fetchBrandContext(): Promise<BrandContextResponse> {
  const data = await apiRequest<unknown>('/brand-context');

  if (!isRecord(data)) {
    return {
      workspaceId: 'unknown-workspace',
      brandContext: null,
      sourceStatus: null,
      confidence: null,
      resolvedContext: null,
      lastResolvedAt: null,
    };
  }

  return {
    workspaceId:
      typeof data.workspaceId === 'string' ? data.workspaceId : 'unknown-workspace',
    brandContext: isRecord(data.brandContext) ? data.brandContext : null,
    sourceStatus: isRecord(data.sourceStatus) ? data.sourceStatus : null,
    confidence: isRecord(data.confidence) ? data.confidence : null,
    resolvedContext: isRecord(data.resolvedContext) ? data.resolvedContext : null,
    lastResolvedAt:
      typeof data.lastResolvedAt === 'string' ? data.lastResolvedAt : null,
  };
}

export async function saveBrandProfile(input: {
  tone?: string;
  salesStyle?: string;
  dataJson?: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const data = await apiRequest<unknown>('/brand-context', {
    method: 'POST',
    body: input,
  });

  return isRecord(data) ? data : {};
}

export async function analyzeWebsite(
  websiteUrl: string,
): Promise<AnalyzeSourceResponse> {
  const data = await apiRequest<unknown>('/brand-context/website/analyze', {
    method: 'POST',
    body: { websiteUrl },
  });

  if (!isRecord(data)) {
    throw new Error('Website analyze response is invalid.');
  }

  return {
    snapshotId: typeof data.snapshotId === 'string' ? data.snapshotId : null,
    workspaceId:
      typeof data.workspaceId === 'string' ? data.workspaceId : 'unknown-workspace',
    confidence: typeof data.confidence === 'number' ? data.confidence : null,
    warnings: asStringArray(data.warnings),
    resolvedContext: isRecord(data.resolvedContext) ? data.resolvedContext : null,
    sourceStatus: isRecord(data.sourceStatus) ? data.sourceStatus : null,
    resolvedConfidence: isRecord(data.resolvedConfidence)
      ? data.resolvedConfidence
      : null,
    lastResolvedAt:
      typeof data.lastResolvedAt === 'string' ? data.lastResolvedAt : null,
    websiteSignals: isRecord(data.websiteSignals) ? data.websiteSignals : undefined,
  };
}

export async function analyzeInstagram(
  instagramHandle?: string,
): Promise<AnalyzeSourceResponse> {
  const data = await apiRequest<unknown>('/brand-context/instagram/analyze', {
    method: 'POST',
    body: {
      instagramHandle,
    },
  });

  if (!isRecord(data)) {
    throw new Error('Instagram analyze response is invalid.');
  }

  return {
    snapshotId: typeof data.snapshotId === 'string' ? data.snapshotId : null,
    workspaceId:
      typeof data.workspaceId === 'string' ? data.workspaceId : 'unknown-workspace',
    confidence: typeof data.confidence === 'number' ? data.confidence : null,
    warnings: asStringArray(data.warnings),
    resolvedContext: isRecord(data.resolvedContext) ? data.resolvedContext : null,
    sourceStatus: isRecord(data.sourceStatus) ? data.sourceStatus : null,
    resolvedConfidence: isRecord(data.resolvedConfidence)
      ? data.resolvedConfidence
      : null,
    lastResolvedAt:
      typeof data.lastResolvedAt === 'string' ? data.lastResolvedAt : null,
    instagramSignals: isRecord(data.instagramSignals)
      ? data.instagramSignals
      : undefined,
  };
}

export async function fetchTrainingSettings(): Promise<TrainingSettingsResponse> {
  const data = await apiRequest<unknown>('/training-settings');

  if (!isRecord(data)) {
    return {
      workspaceId: 'unknown-workspace',
      trainingSettings: {
        workspaceId: 'unknown-workspace',
        productsJson: [],
        faqJson: [],
        rulesJson: {},
        forbiddenResponsesJson: [],
        handoffRulesJson: [],
      },
    };
  }

  const workspaceId =
    typeof data.workspaceId === 'string' ? data.workspaceId : 'unknown-workspace';

  return {
    workspaceId,
    trainingSettings: toTrainingSettingsModel(data.trainingSettings, workspaceId),
    resolvedContext: isRecord(data.resolvedContext) ? data.resolvedContext : null,
    sourceStatus: isRecord(data.sourceStatus) ? data.sourceStatus : null,
    confidence: isRecord(data.confidence) ? data.confidence : null,
    lastResolvedAt:
      typeof data.lastResolvedAt === 'string' ? data.lastResolvedAt : null,
  };
}

export async function updateTrainingSettings(input: {
  productsJson?: Record<string, unknown>[];
  faqJson?: Record<string, unknown>[];
  rulesJson?: Record<string, unknown>;
  forbiddenResponsesJson?: string[];
  handoffRulesJson?: string[];
}): Promise<TrainingSettingsResponse> {
  const data = await apiRequest<unknown>('/training-settings', {
    method: 'PATCH',
    body: input,
  });

  if (!isRecord(data)) {
    throw new Error('Training settings update response is invalid.');
  }

  const workspaceId =
    typeof data.workspaceId === 'string' ? data.workspaceId : 'unknown-workspace';

  return {
    workspaceId,
    trainingSettings: toTrainingSettingsModel(data.trainingSettings, workspaceId),
    resolvedContext: isRecord(data.resolvedContext) ? data.resolvedContext : null,
    sourceStatus: isRecord(data.sourceStatus) ? data.sourceStatus : null,
    confidence: isRecord(data.confidence) ? data.confidence : null,
    lastResolvedAt:
      typeof data.lastResolvedAt === 'string' ? data.lastResolvedAt : null,
  };
}

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverview> {
  return apiRequest<AnalyticsOverview>('/analytics/overview');
}

export async function fetchAnalyticsEvents(
  workspaceId: string,
): Promise<AnalyticsEvent[]> {
  const data = await apiRequest<unknown>(
    `/analytics/workspace/${workspaceId}/events`,
  );

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .filter((entry): entry is Record<string, unknown> => isRecord(entry))
    .map((entry) => ({
      id:
        typeof entry.id === 'string'
          ? entry.id
          : `${workspaceId}-${Math.random().toString(16).slice(2)}`,
      workspaceId:
        typeof entry.workspaceId === 'string'
          ? entry.workspaceId
          : workspaceId,
      conversationId:
        typeof entry.conversationId === 'string' ? entry.conversationId : null,
      type: typeof entry.type === 'string' ? entry.type : 'unknown',
      payloadJson: isRecord(entry.payloadJson) ? entry.payloadJson : null,
      createdAt:
        typeof entry.createdAt === 'string'
          ? entry.createdAt
          : new Date().toISOString(),
    }));
}

export async function fetchAnalyticsFunnel(): Promise<AnalyticsFunnel> {
  return apiRequest<AnalyticsFunnel>('/analytics/funnel');
}

export async function fetchAnalyticsConversationMetrics(): Promise<AnalyticsConversationMetrics> {
  return apiRequest<AnalyticsConversationMetrics>('/analytics/conversations');
}

export async function fetchAnalyticsAiPerformance(): Promise<AnalyticsAiPerformance> {
  return apiRequest<AnalyticsAiPerformance>('/analytics/ai');
}

export async function fetchNotifications(limit = 20): Promise<AppNotification[]> {
  const data = await apiRequest<unknown>(`/notifications?limit=${limit}`);
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((entry) => normalizeNotification(entry))
    .filter((entry): entry is AppNotification => entry !== null);
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const data = await apiRequest<unknown>('/notifications/unread-count');
  if (!isRecord(data) || typeof data.unreadCount !== 'number') {
    return 0;
  }

  return data.unreadCount;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await apiRequest(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiRequest('/notifications/read-all', {
    method: 'PATCH',
  });
}

export async function fetchConnectionStatus(): Promise<ConnectionStatusResponse> {
  const data = await apiRequest<unknown>('/whatsapp/connection');
  return toConnectionStatus(data);
}

export async function testWhatsAppConnection(): Promise<ConnectionActionResponse> {
  const data = await apiRequest<unknown>('/whatsapp/connection/test', {
    method: 'POST',
  });

  if (!isRecord(data)) {
    throw new Error('Connection test response is invalid.');
  }

  return {
    ok: Boolean(data.ok),
    action: 'test',
    message:
      typeof data.message === 'string'
        ? data.message
        : 'Connection test completed.',
    checkedAt:
      typeof data.checkedAt === 'string' ? data.checkedAt : new Date().toISOString(),
    status: toConnectionStatus(data.status),
  };
}

export async function reconnectWhatsAppConnection(): Promise<ConnectionActionResponse> {
  const data = await apiRequest<unknown>('/whatsapp/connection/reconnect', {
    method: 'POST',
  });

  if (!isRecord(data)) {
    throw new Error('Connection reconnect response is invalid.');
  }

  return {
    ok: Boolean(data.ok),
    action: 'reconnect',
    message:
      typeof data.message === 'string'
        ? data.message
        : 'Connection reconnect completed.',
    checkedAt:
      typeof data.checkedAt === 'string' ? data.checkedAt : new Date().toISOString(),
    status: toConnectionStatus(data.status),
  };
}

export async function removeWhatsAppConnection(): Promise<ConnectionActionResponse> {
  const data = await apiRequest<unknown>('/whatsapp/connection', {
    method: 'DELETE',
  });

  if (!isRecord(data)) {
    throw new Error('Connection removal response is invalid.');
  }

  return {
    ok: Boolean(data.ok),
    action: 'remove',
    message:
      typeof data.message === 'string'
        ? data.message
        : 'Connection removed.',
    checkedAt:
      typeof data.checkedAt === 'string' ? data.checkedAt : new Date().toISOString(),
    status: toConnectionStatus(data.status),
  };
}

export async function requestAiDecisionPreview(input: {
  conversationId?: string;
  messageId?: string;
  customerMessage?: string;
}): Promise<Record<string, unknown>> {
  const data = await apiRequest<unknown>('/ai/decision/test', {
    method: 'POST',
    body: input,
  });

  return isRecord(data) ? data : {};
}

export async function requestSalesDecisionPreview(input: {
  conversationId?: string;
  messageId?: string;
  customerMessage?: string;
}): Promise<Record<string, unknown>> {
  const data = await apiRequest<unknown>('/sales/decision/test', {
    method: 'POST',
    body: input,
  });

  return isRecord(data) ? data : {};
}

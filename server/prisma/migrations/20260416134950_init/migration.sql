-- CreateEnum
CREATE TYPE "public"."LeadStage" AS ENUM ('new', 'qualified', 'hot', 'lost', 'support');

-- CreateEnum
CREATE TYPE "public"."ConversationStatus" AS ENUM ('active', 'closed');

-- CreateEnum
CREATE TYPE "public"."SenderType" AS ENUM ('user', 'ai', 'human');

-- CreateTable
CREATE TABLE "public"."conversations" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "leadStage" "public"."LeadStage" NOT NULL DEFAULT 'new',
    "status" "public"."ConversationStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderType" "public"."SenderType" NOT NULL,
    "content" TEXT NOT NULL,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."brand_contexts" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "tone" TEXT,
    "salesStyle" TEXT,
    "dataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."training_settings" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "faqJson" JSONB,
    "productsJson" JSONB,
    "rulesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."whatsapp_connections" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "accessTokenEncrypted" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."handoff_sessions" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "handoff_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analytics_events" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_workspaceId_phoneNumber_idx" ON "public"."conversations"("workspaceId", "phoneNumber");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "public"."messages"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "brand_contexts_workspaceId_key" ON "public"."brand_contexts"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "training_settings_workspaceId_key" ON "public"."training_settings"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_connections_workspaceId_key" ON "public"."whatsapp_connections"("workspaceId");

-- CreateIndex
CREATE INDEX "handoff_sessions_conversationId_startedAt_idx" ON "public"."handoff_sessions"("conversationId", "startedAt");

-- CreateIndex
CREATE INDEX "analytics_events_workspaceId_type_createdAt_idx" ON "public"."analytics_events"("workspaceId", "type", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."handoff_sessions" ADD CONSTRAINT "handoff_sessions_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

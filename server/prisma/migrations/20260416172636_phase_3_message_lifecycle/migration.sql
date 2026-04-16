-- CreateEnum
CREATE TYPE "public"."MessageDirection" AS ENUM ('inbound', 'outbound');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('text', 'status', 'unknown');

-- CreateEnum
CREATE TYPE "public"."MessageStatus" AS ENUM ('sent', 'delivered', 'read', 'received', 'unknown');

-- AlterTable
ALTER TABLE "public"."conversations"
ADD COLUMN "lastMessageAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."messages"
ADD COLUMN "direction" "public"."MessageDirection" NOT NULL DEFAULT 'inbound',
ADD COLUMN "externalMessageId" TEXT,
ADD COLUMN "messageType" "public"."MessageType" NOT NULL DEFAULT 'unknown',
ADD COLUMN "status" "public"."MessageStatus" NOT NULL DEFAULT 'unknown',
ADD COLUMN "timestamp" TIMESTAMP(3),
ALTER COLUMN "content" DROP NOT NULL;

UPDATE "public"."messages"
SET "rawPayload" = '{}'::jsonb
WHERE "rawPayload" IS NULL;

ALTER TABLE "public"."messages"
ALTER COLUMN "rawPayload" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."inbound_event_logs" (
    "id" TEXT NOT NULL,
    "dedupKey" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inbound_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inbound_event_logs_dedupKey_key" ON "public"."inbound_event_logs"("dedupKey");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_workspaceId_phoneNumber_key" ON "public"."conversations"("workspaceId", "phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "messages_externalMessageId_key" ON "public"."messages"("externalMessageId");

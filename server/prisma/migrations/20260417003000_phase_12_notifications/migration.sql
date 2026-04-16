-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM (
    'lead_hot',
    'handoff_started',
    'reply_failed',
    'connection_error',
    'daily_summary',
    'weekly_summary',
    'info'
);

-- CreateEnum
CREATE TYPE "public"."NotificationChannel" AS ENUM ('in_app', 'email', 'both');

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "public"."NotificationType" NOT NULL,
    "channel" "public"."NotificationChannel" NOT NULL DEFAULT 'in_app',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "payloadJson" JSONB,
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_workspaceId_createdAt_idx" ON "public"."notifications"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_workspaceId_isRead_createdAt_idx" ON "public"."notifications"("workspaceId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_workspaceId_userId_isRead_createdAt_idx" ON "public"."notifications"("workspaceId", "userId", "isRead", "createdAt");

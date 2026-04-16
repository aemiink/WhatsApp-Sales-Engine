-- AlterTable
ALTER TABLE "public"."analytics_events"
ADD COLUMN "conversationId" TEXT;

-- CreateIndex
CREATE INDEX "analytics_events_workspaceId_conversationId_createdAt_idx"
ON "public"."analytics_events"("workspaceId", "conversationId", "createdAt");

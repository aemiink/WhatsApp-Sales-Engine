-- CreateTable
CREATE TABLE "public"."queue_failure_logs" (
    "id" TEXT NOT NULL,
    "queueName" TEXT NOT NULL,
    "jobId" TEXT,
    "workspaceId" TEXT,
    "conversationId" TEXT,
    "payloadJson" JSONB,
    "errorMessage" TEXT NOT NULL,
    "errorStack" TEXT,
    "attempt" INTEGER NOT NULL,
    "maxAttempts" INTEGER NOT NULL,
    "failedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "queue_failure_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "queue_failure_logs_queueName_failedAt_idx" ON "public"."queue_failure_logs"("queueName", "failedAt");

-- CreateIndex
CREATE INDEX "queue_failure_logs_workspaceId_failedAt_idx" ON "public"."queue_failure_logs"("workspaceId", "failedAt");

-- CreateIndex
CREATE INDEX "queue_failure_logs_conversationId_failedAt_idx" ON "public"."queue_failure_logs"("conversationId", "failedAt");

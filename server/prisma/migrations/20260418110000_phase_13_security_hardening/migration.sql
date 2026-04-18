-- CreateTable
CREATE TABLE "public"."instagram_connections" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "instagramUserId" TEXT NOT NULL,
    "username" TEXT,
    "accessTokenEncrypted" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instagram_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auth_sessions" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instagram_connections_workspaceId_key" ON "public"."instagram_connections"("workspaceId");

-- CreateIndex
CREATE INDEX "instagram_connections_workspaceId_updatedAt_idx" ON "public"."instagram_connections"("workspaceId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_tokenId_key" ON "public"."auth_sessions"("tokenId");

-- CreateIndex
CREATE INDEX "auth_sessions_workspaceId_revokedAt_createdAt_idx" ON "public"."auth_sessions"("workspaceId", "revokedAt", "createdAt");

-- CreateIndex
CREATE INDEX "auth_sessions_userId_revokedAt_createdAt_idx" ON "public"."auth_sessions"("userId", "revokedAt", "createdAt");

-- CreateIndex
CREATE INDEX "auth_sessions_expiresAt_idx" ON "public"."auth_sessions"("expiresAt");

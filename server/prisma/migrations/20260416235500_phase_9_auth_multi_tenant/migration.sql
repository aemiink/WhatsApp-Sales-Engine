-- CreateEnum
CREATE TYPE "public"."WorkspaceRole" AS ENUM ('admin', 'agent', 'viewer');

-- CreateTable
CREATE TABLE "public"."workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspace_members" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."WorkspaceRole" NOT NULL DEFAULT 'agent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- Seed default workspace for existing single-tenant data
INSERT INTO "public"."workspaces" ("id", "name", "createdAt", "updatedAt")
VALUES ('default-workspace', 'Default Workspace', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- AlterTable
ALTER TABLE "public"."inbound_event_logs"
ADD COLUMN "workspaceId" TEXT NOT NULL DEFAULT 'default-workspace';

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspaceId_userId_key" ON "public"."workspace_members"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "workspace_members_userId_workspaceId_idx" ON "public"."workspace_members"("userId", "workspaceId");

-- CreateIndex
CREATE INDEX "inbound_event_logs_workspaceId_receivedAt_idx" ON "public"."inbound_event_logs"("workspaceId", "receivedAt");

-- AddForeignKey
ALTER TABLE "public"."workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_members" ADD CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

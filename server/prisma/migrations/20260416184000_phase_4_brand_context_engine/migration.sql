-- AlterTable
ALTER TABLE "public"."brand_contexts"
ADD COLUMN "sourceStatusJson" JSONB,
ADD COLUMN "websiteSignalsJson" JSONB,
ADD COLUMN "instagramSignalsJson" JSONB,
ADD COLUMN "resolvedContextJson" JSONB,
ADD COLUMN "confidenceJson" JSONB,
ADD COLUMN "lastResolvedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."training_settings"
ADD COLUMN "forbiddenResponsesJson" JSONB,
ADD COLUMN "handoffRulesJson" JSONB,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Keep @updatedAt columns aligned with Prisma datamodel semantics.
ALTER TABLE "public"."brand_contexts" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "public"."training_settings" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "public"."website_analysis_snapshots" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "rootUrl" TEXT NOT NULL,
    "pagesJson" JSONB NOT NULL,
    "extractedSignalsJson" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "website_analysis_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."instagram_analysis_snapshots" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "instagramHandle" TEXT NOT NULL,
    "profileJson" JSONB NOT NULL,
    "postsJson" JSONB NOT NULL,
    "extractedSignalsJson" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instagram_analysis_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "website_analysis_snapshots_workspaceId_createdAt_idx" ON "public"."website_analysis_snapshots"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "instagram_analysis_snapshots_workspaceId_createdAt_idx" ON "public"."instagram_analysis_snapshots"("workspaceId", "createdAt");

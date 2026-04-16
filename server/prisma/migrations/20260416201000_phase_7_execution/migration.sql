-- CreateEnum
CREATE TYPE "public"."AiMode" AS ENUM ('auto_reply', 'suggest_only', 'paused');

-- AlterTable
ALTER TABLE "public"."conversations"
ADD COLUMN "aiMode" "public"."AiMode" NOT NULL DEFAULT 'auto_reply';

-- AlterTable
ALTER TABLE "public"."whatsapp_connections" ADD COLUMN     "businessAccountId" TEXT,
ADD COLUMN     "phoneNumberId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "webhookVerifyToken" TEXT;

ALTER TABLE "public"."whatsapp_connections" ALTER COLUMN "phoneNumberId" DROP DEFAULT;

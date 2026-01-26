-- AlterTable
ALTER TABLE "EmailOTP" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "blockedUntill" TIMESTAMP(3);

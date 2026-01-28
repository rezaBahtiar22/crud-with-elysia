-- DropIndex
DROP INDEX "EmailOTP_userId_idx";

-- AlterTable
ALTER TABLE "EmailOTP" ALTER COLUMN "userId" DROP NOT NULL;

/*
  Warnings:

  - You are about to drop the column `blockedUntill` on the `EmailOTP` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmailOTP" DROP COLUMN "blockedUntill",
ADD COLUMN     "blockedUntil" TIMESTAMP(3);

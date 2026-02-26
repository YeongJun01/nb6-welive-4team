/*
  Warnings:

  - The values [URGENT,POLL,COMPLAINT,GENERAL] on the enum `NoticeType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `pollResult` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `isRegistered` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `apartmentName` on the `UserAptInfo` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NoticeType_new" AS ENUM ('MAINTENANCE', 'EMERGENCY', 'COMMUNITY', 'RESIDENT_VOTE', 'RESIDENT_COUNCIL', 'ETC');
ALTER TABLE "Notice" ALTER COLUMN "category" TYPE "NoticeType_new" USING ("category"::text::"NoticeType_new");
ALTER TYPE "NoticeType" RENAME TO "NoticeType_old";
ALTER TYPE "NoticeType_new" RENAME TO "NoticeType";
DROP TYPE "NoticeType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SIGNUP_REQ';

-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "pollResult";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isRegistered";

-- AlterTable
ALTER TABLE "UserAptInfo" DROP COLUMN "apartmentName";

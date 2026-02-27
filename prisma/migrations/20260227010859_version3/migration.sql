/*
  Warnings:

  - The `apartmentStatus` column on the `Apartment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `houseRole` on the `ResidentList` table. All the data in the column will be lost.
  - You are about to drop the column `residenceStatus` on the `ResidentList` table. All the data in the column will be lost.
  - The `approvalStatus` column on the `ResidentList` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `residentListId` on the `User` table. All the data in the column will be lost.
  - The `joinStatus` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `UserAptInfo` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `ResidentList` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEED_UPDATE', 'MOVED_OUT');

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_residentListId_fkey";

-- DropForeignKey
ALTER TABLE "UserAptInfo" DROP CONSTRAINT "UserAptInfo_userId_fkey";

-- DropIndex
DROP INDEX "ResidentList_contact_key";

-- DropIndex
DROP INDEX "User_residentListId_key";

-- AlterTable
ALTER TABLE "Apartment" DROP COLUMN "apartmentStatus",
ADD COLUMN     "apartmentStatus" "Status" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "ResidentList" DROP COLUMN "houseRole",
DROP COLUMN "residenceStatus",
ADD COLUMN     "isHouseholder" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "userId" TEXT,
DROP COLUMN "approvalStatus",
ADD COLUMN     "approvalStatus" "Status" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "residentListId",
DROP COLUMN "joinStatus",
ADD COLUMN     "joinStatus" "Status" NOT NULL DEFAULT 'PENDING';

-- DropTable
DROP TABLE "UserAptInfo";

-- DropEnum
DROP TYPE "ApprovalStatus";

-- DropEnum
DROP TYPE "HouseholdRole";

-- DropEnum
DROP TYPE "JoinStatus";

-- DropEnum
DROP TYPE "ResidenceStatus";

-- CreateIndex
CREATE UNIQUE INDEX "ResidentList_userId_key" ON "ResidentList"("userId");

-- AddForeignKey
ALTER TABLE "ResidentList" ADD CONSTRAINT "ResidentList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

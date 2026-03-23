-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEED_UPDATE', 'MOVED_OUT');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('UPCOMING', 'ONGOING', 'CLOSED');

-- CreateEnum
CREATE TYPE "NoticeType" AS ENUM ('MAINTENANCE', 'EMERGENCY', 'COMMUNITY', 'RESIDENT_VOTE', 'RESIDENT_COUNCIL', 'ETC');

-- CreateEnum
CREATE TYPE "BoardType" AS ENUM ('NOTICE', 'POLL', 'COMPLAINT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NOTICE', 'COMPLAINT_RAISED', 'COMPLAINT_IN_PROGRESS', 'COMPLAINT_RESOLVED', 'COMPLAINT_REJECTED', 'POLL_START', 'POLL_END', 'SIGNUP_REQ');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar" TEXT,
    "role" "UserType" NOT NULL DEFAULT 'USER',
    "joinStatus" "Status" NOT NULL DEFAULT 'PENDING',
    "apartmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResidentList" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "apartmentId" TEXT NOT NULL,
    "apartmentDong" TEXT NOT NULL,
    "apartmentHo" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isHouseholder" BOOLEAN NOT NULL DEFAULT true,
    "isRegistered" BOOLEAN NOT NULL DEFAULT true,
    "approvalStatus" "Status" NOT NULL DEFAULT 'PENDING',
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ResidentList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Apartment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "officeNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startComplexNumber" INTEGER NOT NULL DEFAULT 1,
    "startBuildingNumber" INTEGER NOT NULL DEFAULT 1,
    "startFloorNumber" INTEGER NOT NULL DEFAULT 1,
    "startUnitNumber" INTEGER NOT NULL DEFAULT 1,
    "endComplexNumber" INTEGER NOT NULL,
    "endBuildingNumber" INTEGER NOT NULL,
    "endFloorNumber" INTEGER NOT NULL,
    "endUnitNumber" INTEGER NOT NULL,
    "apartmentStatus" "Status" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Apartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "boardType" "BoardType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "apartmentDong" TEXT NOT NULL,
    "apartmentHo" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'PENDING',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poll" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "buildingPermission" TEXT[],
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "PollStatus" NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollOption" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "category" "NoticeType" NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notiType" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintComment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplaintComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoticeComment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "noticeId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoticeComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "noticeId" TEXT,
    "pollId" TEXT,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_contact_key" ON "User"("contact");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ResidentList_userId_key" ON "ResidentList"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Apartment_officeNumber_key" ON "Apartment"("officeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Apartment_name_address_key" ON "Apartment"("name", "address");

-- CreateIndex
CREATE UNIQUE INDEX "Board_apartmentId_boardType_key" ON "Board"("apartmentId", "boardType");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_pollId_userId_key" ON "Vote"("pollId", "userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentList" ADD CONSTRAINT "ResidentList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentList" ADD CONSTRAINT "ResidentList_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollOption" ADD CONSTRAINT "PollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "PollOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintComment" ADD CONSTRAINT "ComplaintComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintComment" ADD CONSTRAINT "ComplaintComment_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoticeComment" ADD CONSTRAINT "NoticeComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoticeComment" ADD CONSTRAINT "NoticeComment_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the `VideoAttempt` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VideoAttempt" DROP CONSTRAINT "VideoAttempt_userId_fkey";

-- DropTable
DROP TABLE "VideoAttempt";

-- CreateTable
CREATE TABLE "VideoInterview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "totalSteps" INTEGER NOT NULL DEFAULT 5,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "finalScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoInterview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoInterviewStep" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "videoUrl" TEXT,
    "audioUrl" TEXT,
    "transcript" TEXT,
    "score" DOUBLE PRECISION,
    "relevance" DOUBLE PRECISION,
    "clarity" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "feedback" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoInterviewStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoInterview_userId_idx" ON "VideoInterview"("userId");

-- CreateIndex
CREATE INDEX "VideoInterviewStep_interviewId_idx" ON "VideoInterviewStep"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoInterviewStep_interviewId_stepNumber_key" ON "VideoInterviewStep"("interviewId", "stepNumber");

-- AddForeignKey
ALTER TABLE "VideoInterview" ADD CONSTRAINT "VideoInterview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoInterviewStep" ADD CONSTRAINT "VideoInterviewStep_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "VideoInterview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

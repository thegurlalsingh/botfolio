/*
  Warnings:

  - You are about to drop the column `answers` on the `McqAttempt` table. All the data in the column will be lost.
  - You are about to drop the column `questions` on the `McqAttempt` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `McqAttempt` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "McqAttempt" DROP CONSTRAINT "McqAttempt_userId_fkey";

-- AlterTable
ALTER TABLE "McqAttempt" DROP COLUMN "answers",
DROP COLUMN "questions",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "JobDescription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobDescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McqQuestion" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "correct" TEXT NOT NULL,
    "explanation" TEXT,
    "topic" TEXT,
    "difficulty" TEXT,
    "competency" TEXT,
    "candidateAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "McqQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobDescription_userId_idx" ON "JobDescription"("userId");

-- CreateIndex
CREATE INDEX "McqQuestion_attemptId_idx" ON "McqQuestion"("attemptId");

-- CreateIndex
CREATE INDEX "McqAttempt_userId_idx" ON "McqAttempt"("userId");

-- AddForeignKey
ALTER TABLE "JobDescription" ADD CONSTRAINT "JobDescription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McqQuestion" ADD CONSTRAINT "McqQuestion_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "McqAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McqAttempt" ADD CONSTRAINT "McqAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

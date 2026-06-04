-- AlterTable
ALTER TABLE "User" ADD COLUMN     "videoScore" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "VideoAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoAttempt_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VideoAttempt" ADD CONSTRAINT "VideoAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

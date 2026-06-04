-- AlterTable
ALTER TABLE "User" ADD COLUMN     "codingScore" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "CodingAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "code" TEXT,
    "language" TEXT,
    "score" DOUBLE PRECISION,
    "feedback" DOUBLE PRECISION,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodingAttempt_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CodingAttempt" ADD CONSTRAINT "CodingAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

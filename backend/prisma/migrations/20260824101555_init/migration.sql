-- CreateEnum
CREATE TYPE "Role" AS ENUM ('candidate', 'hr');

-- CreateEnum
CREATE TYPE "Step" AS ENUM ('info', 'mcq', 'video', 'coding', 'completed');

-- CreateTable
CREATE TABLE "ExperienceTimeline" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "company" TEXT,
    "duration" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ExperienceTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationTimeLine" (
    "id" TEXT NOT NULL,
    "college" TEXT,
    "degree_name" TEXT,
    "from_to" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "EducationTimeLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'candidate',
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),
    "phone" TEXT,
    "location" TEXT,
    "resumeUrl" TEXT,
    "currentStep" "Step" DEFAULT 'info',
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "designation" TEXT,
    "experienceYear" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mcqScore" DOUBLE PRECISION,
    "videoScore" DOUBLE PRECISION,
    "codingScore" DOUBLE PRECISION,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McqAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "answers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "McqAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "videoUrl" TEXT,
    "audioUrl" TEXT,
    "transcript" TEXT,
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "testCases" JSONB NOT NULL,
    "code" TEXT,
    "language" TEXT,
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodingAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_password_key" ON "User"("password");

-- AddForeignKey
ALTER TABLE "ExperienceTimeline" ADD CONSTRAINT "ExperienceTimeline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationTimeLine" ADD CONSTRAINT "EducationTimeLine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McqAttempt" ADD CONSTRAINT "McqAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoAttempt" ADD CONSTRAINT "VideoAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingAttempt" ADD CONSTRAINT "CodingAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

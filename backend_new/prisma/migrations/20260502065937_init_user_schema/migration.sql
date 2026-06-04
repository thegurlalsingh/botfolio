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
    "pasword" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'candidate',
    "refreshToken" TEXT NOT NULL,
    "refreshTokenExpires" TIMESTAMP(3) NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_pasword_key" ON "User"("pasword");

-- AddForeignKey
ALTER TABLE "ExperienceTimeline" ADD CONSTRAINT "ExperienceTimeline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationTimeLine" ADD CONSTRAINT "EducationTimeLine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

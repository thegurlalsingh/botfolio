/*
  Warnings:

  - You are about to drop the column `codingScore` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `videoScore` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "codingScore",
DROP COLUMN "videoScore";

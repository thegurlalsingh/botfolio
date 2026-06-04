/*
  Warnings:

  - Added the required column `testCases` to the `CodingAttempt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CodingAttempt" ADD COLUMN     "testCases" JSONB NOT NULL;

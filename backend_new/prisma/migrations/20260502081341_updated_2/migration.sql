-- AlterTable
ALTER TABLE "User" ALTER COLUMN "refreshToken" DROP NOT NULL,
ALTER COLUMN "refreshTokenExpires" DROP NOT NULL;

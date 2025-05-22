/*
  Warnings:

  - You are about to drop the column `guestId` on the `accounts` table. All the data in the column will be lost.
  - Made the column `userId` on table `accounts` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CLIENT');

-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_guestId_fkey";

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "guestId",
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole";

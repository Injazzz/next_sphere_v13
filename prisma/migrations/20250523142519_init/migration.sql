/*
  Warnings:

  - Made the column `isPinned` on table `documents` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "documents" ALTER COLUMN "isPinned" SET NOT NULL;

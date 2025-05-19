/*
  Warnings:

  - You are about to drop the column `approvedById` on the `documents` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "document_files" ADD COLUMN     "encrypted" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "approvedById";

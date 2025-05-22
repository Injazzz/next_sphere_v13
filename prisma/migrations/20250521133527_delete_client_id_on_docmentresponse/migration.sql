/*
  Warnings:

  - You are about to drop the column `clientId` on the `document_responses` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "document_responses" DROP CONSTRAINT "document_responses_clientId_fkey";

-- AlterTable
ALTER TABLE "document_responses" DROP COLUMN "clientId";

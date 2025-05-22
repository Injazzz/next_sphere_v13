/*
  Warnings:

  - Added the required column `clientId` to the `document_responses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "document_responses" ADD COLUMN     "clientId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "document_responses" ADD CONSTRAINT "document_responses_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

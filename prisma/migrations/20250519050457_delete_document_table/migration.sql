/*
  Warnings:

  - You are about to drop the `client_magic_links` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `document_files` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `document_responses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `documents` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "client_magic_links" DROP CONSTRAINT "client_magic_links_email_fkey";

-- DropForeignKey
ALTER TABLE "document_files" DROP CONSTRAINT "document_files_documentId_fkey";

-- DropForeignKey
ALTER TABLE "document_responses" DROP CONSTRAINT "document_responses_documentId_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_clientId_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_createdById_fkey";

-- DropTable
DROP TABLE "client_magic_links";

-- DropTable
DROP TABLE "document_files";

-- DropTable
DROP TABLE "document_responses";

-- DropTable
DROP TABLE "documents";

-- DropEnum
DROP TYPE "DocumentFlow";

-- DropEnum
DROP TYPE "DocumentStatus";

-- DropEnum
DROP TYPE "DocumentType";

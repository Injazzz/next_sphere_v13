-- AlterTable
ALTER TABLE "document_files" ADD COLUMN     "iv" TEXT,
ALTER COLUMN "encrypted" SET DEFAULT false;

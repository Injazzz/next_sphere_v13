/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `clients` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "clients_token_key" ON "clients"("token");

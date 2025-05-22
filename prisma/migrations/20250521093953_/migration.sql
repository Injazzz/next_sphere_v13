/*
  Warnings:

  - A unique constraint covering the columns `[sessionToken]` on the table `clients` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "clients_sessionToken_key" ON "clients"("sessionToken");

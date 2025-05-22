-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "guestId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

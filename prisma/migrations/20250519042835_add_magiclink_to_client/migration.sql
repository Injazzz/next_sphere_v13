-- AddForeignKey
ALTER TABLE "client_magic_links" ADD CONSTRAINT "client_magic_links_email_fkey" FOREIGN KEY ("email") REFERENCES "clients"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

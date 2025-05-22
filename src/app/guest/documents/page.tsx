import DocumentsList from "@/components/guest/document-list";
import GuestHeader from "@/components/guest/guest-header";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Documents",
  description: "View and manage your documents",
};

export default function GuestDocumentsPage() {
  return (
    <div className='flex flex-col min-h-screen'>
      <GuestHeader />
      <main className='flex-1 w-full max-w-7xl mx-auto p-4 py-8'>
        <h1 className='text-2xl font-bold mb-6'>Your Documents</h1>
        <DocumentsList />
      </main>
    </div>
  );
}

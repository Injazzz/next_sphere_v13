import DocumentDetail from "@/components/guest/document-detail";
import GuestHeader from "@/components/guest/guest-header";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Document Details",
  description: "View document details and files",
};

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const docId = (await params).id;
  return (
    <div className='flex flex-col min-h-screen'>
      <GuestHeader />
      <main className='flex-1 w-full max-w-7xl mx-auto p-4 py-8'>
        <DocumentDetail id={docId} />
      </main>
    </div>
  );
}

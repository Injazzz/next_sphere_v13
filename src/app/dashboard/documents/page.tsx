import { DocumentTable } from "@/components/documents/document-table";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DocumentsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-semibold'>Documents</h1>
      </div>
      <DocumentTable />
    </div>
  );
}

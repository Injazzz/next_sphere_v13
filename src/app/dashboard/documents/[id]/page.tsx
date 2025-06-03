import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { DocumentDetail } from "@/components/documents/document-detail";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const documentId = (await params).id;

  // Fetch document data
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}`,
    {
      headers: await headers(),
    }
  );

  if (!response.ok) {
    notFound();
  }

  const document = await response.json();

  return (
    <div className='w-full flex flex-col gap-4'>
      <h1 className='text-3xl font-semibold'>Document Details</h1>
      <DocumentDetail document={document} session={session} />
    </div>
  );
}

import { DocumentEditForm } from "@/components/documents/document-edit-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export default async function DocumentEditPage({
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
    <div className='flex flex-col gap-4 w-full justify-center items-center'>
      <h1 className='text-3xl font-semibold'>Edit Document</h1>
      <DocumentEditForm document={document} />
    </div>
  );
}

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { EditClientForm } from "@/components/client/edit-client-form";

export default async function EditClientPage({
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

  const param = await params;
  const userId = param.id;

  // Fetch client data
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/clients/${userId}`,
    {
      headers: await headers(),
    }
  );

  if (!response.ok) {
    notFound();
  }

  const client = await response.json();

  // Verify that the client belongs to the current user
  if (client.createdById !== session.user.id) {
    redirect("/dashboard/clients?error=unauthorized");
  }

  return (
    <div className='w-full flex flex-col gap-4 justify-center items-center'>
      <h1 className='text-3xl font-semibold'>Edit Client</h1>
      <EditClientForm client={client} />
    </div>
  );
}

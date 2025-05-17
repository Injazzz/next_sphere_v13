import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ClientDetail } from "@/components/client/client-detail";

export default async function ClientPage({
  params,
}: {
  params: { id: string };
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

  return (
    <div className='w-full flex flex-col gap-4'>
      <h1 className='text-3xl font-semibold'>Client Details</h1>
      <ClientDetail client={client} session={session} />
    </div>
  );
}

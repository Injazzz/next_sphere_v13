import TeamDetail from "@/components/team/team-detail";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function TeamPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const teamId = (await params).id;

  return (
    <div className='w-full flex flex-col gap-4'>
      <TeamDetail teamId={teamId} />
    </div>
  );
}

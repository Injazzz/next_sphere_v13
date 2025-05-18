import TeamCard from "@/components/team/team-card";
import TeamHeader from "@/components/team/team-header";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  return (
    <div className='w-full flex flex-col gap-4'>
      <TeamHeader />
      <hr />

      <TeamCard />
    </div>
  );
}

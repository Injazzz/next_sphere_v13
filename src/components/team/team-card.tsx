/* eslint-disable @typescript-eslint/no-explicit-any */
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { CreateTeamDialog } from "./create-team-dialog";

export default async function TeamCard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  // Fetch user's team
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, {
    headers: await headers(),
  });

  if (!response.ok) {
    return null;
  }

  const teams = await response.json();
  const team = teams[0]; // User can only be in one team

  if (!team) {
    return <CreateTeamDialog />;
  }

  // Urutkan member: leader pertama
  const sortedMembers = [...team.members].sort((a, b) => {
    if (a.role === "LEADER") return -1;
    if (b.role === "LEADER") return 1;
    return 0;
  });

  return (
    <div className='flex flex-col gap-4 w-full'>
      <h2 className='text-2xl'>Your Team</h2>

      <Link
        href={`/dashboard/teams/${team.id}`}
        className='w-full max-w-md h-42 p-4 bg-background rounded-xl border flex flex-col gap-3 hover:bg-accent transition-colors'
      >
        <div className='flex justify-between items-center'>
          <h3 className='text-2xl font-semibold'>{team.name}</h3>
          <span className='text-sm text-muted-foreground'>
            {new Date(team.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div className='flex -space-x-3 mt-5'>
          {sortedMembers.slice(0, 5).map((member: any) => (
            <div key={member.user.id} className='relative'>
              <Avatar
                className={`w-10 h-10 border-2 backdrop-blur-lg ${
                  member.role === "LEADER"
                    ? "border-yellow-500"
                    : "border-zinc-700"
                }`}
              >
                <AvatarImage src={member.user.image || ""} />
                <AvatarFallback>
                  <p className='text-xl'>
                    {member.user.name.charAt(0).toUpperCase()}
                  </p>
                </AvatarFallback>
              </Avatar>
            </div>
          ))}
          {team.members.length > 3 && (
            <div className='w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background'>
              +{team.members.length - 5}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

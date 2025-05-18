/* eslint-disable @typescript-eslint/no-explicit-any */
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { InviteMemberDialog } from "./invite-member-dialog";
import { LeaveTeamDialog } from "./leave-team-dialog";
import { RemoveMemberDialog } from "./remove-member-dialog";
import { TransferLeadershipDialog } from "./transfer-leadership-dialog";

export default async function TeamDetail({ teamId }: { teamId: string }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/teams/${teamId}`,
    {
      headers: await headers(),
    }
  );

  if (!response.ok) return null;

  const team = await response.json();
  const currentUser = team.members.find(
    (member: any) => member.userId === session.user.id
  );

  // Urutkan members: leader pertama, diikuti oleh member lainnya
  const sortedMembers = [...team.members].sort((a, b) => {
    if (a.role === "LEADER") return -1;
    if (b.role === "LEADER") return 1;
    return 0;
  });

  return (
    <div className='w-full mx-auto'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold'>{team.name}</h1>
        {currentUser?.role === "LEADER" && (
          <div className='flex gap-2'>
            <InviteMemberDialog teamId={team.id} />
            <LeaveTeamDialog teamId={team.id} />
          </div>
        )}
      </div>

      <div className='w-full flex gap-6 flex-wrap md:justify-start justify-center'>
        {sortedMembers.map((member: any) => (
          <div
            key={member.user.id}
            className='flex flex-col items-center justify-between p-4 rounded-lg'
          >
            <div className='flex flex-col items-center gap-4'>
              <Avatar className='w-36 h-36 border'>
                <AvatarImage src={member.user.image || ""} />
                <AvatarFallback>
                  <p className='text-7xl'>
                    {member.user.name.charAt(0).toUpperCase()}
                  </p>
                </AvatarFallback>
              </Avatar>
              <div>
                <p className='font-medium text-center'>{member.user.name}</p>
                <p className='text-sm text-center text-muted-foreground'>
                  {member.user.email}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2 mt-3'>
              {member.role === "LEADER" && (
                <span className='px-2 py-1 text-xs font-medium rounded-full bg-yellow-700 dark:bg-yellow-500/35 border-yellow-200 text-yellow-200'>
                  Leader
                </span>
              )}
              {currentUser?.role === "LEADER" && member.role !== "LEADER" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <span className='px-2 py-1 cursor-pointer text-xs font-medium rounded-full bg-primary/35 border-primary'>
                      member
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <TransferLeadershipDialog
                      teamId={team.id}
                      memberId={member.user.id}
                    />
                    <RemoveMemberDialog
                      teamId={team.id}
                      memberId={member.user.id}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {currentUser?.userId === member.userId &&
                currentUser?.role !== "LEADER" && (
                  <LeaveTeamDialog teamId={team.id} />
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

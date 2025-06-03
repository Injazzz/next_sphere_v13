import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { validateInvitation } from "@/lib/server/email/invitation-utils";

export default async function JoinTeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const teamId = (await params).id;
  const token = (await searchParams).token;

  if (!session) {
    redirect(`/login?callbackUrl=/dashboard/teams/${teamId}/join`);
  }

  if (token) {
    try {
      await validateInvitation(token);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return (
        <div className='w-full max-w-md mx-auto p-8 text-center'>
          <h2 className='text-2xl font-bold mb-4'>Invalid Invitation</h2>
          <p className='mb-6 text-destructive'>{error.message}</p>
          <Button asChild>
            <a href='/dashboard'>Back to Dashboard</a>
          </Button>
        </div>
      );
    }
  }

  // Check if team exists
  const team = await prisma.team.findUnique({
    where: { id: teamId },
  });

  if (!team) {
    notFound();
  }

  // Check if user is already in a team
  const existingTeam = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      team: true,
    },
  });

  if (existingTeam) {
    return (
      <div className='w-full max-w-md mx-auto p-8 text-center'>
        <h2 className='text-2xl font-bold mb-4'>Already in a Team</h2>
        <p className='mb-6'>
          You can only be in one team at a time. Please leave your current team
          before joining another one.
        </p>
        <Button asChild>
          <a href={`/dashboard/teams/${existingTeam.teamId}`}>
            Go to your team
          </a>
        </Button>
      </div>
    );
  }

  // Check if user is already in this team
  const existingMember = await prisma.teamMember.findFirst({
    where: {
      teamId: teamId,
      userId: session.user.id,
    },
  });

  if (existingMember) {
    redirect(`/dashboard/teams/${teamId}`);
  }

  async function joinTeam() {
    "use server";

    try {
      // Validasi token jika ada
      if (token) {
        const invitation = await validateInvitation(token);

        // Hapus invitation setelah digunakan
        await prisma.teamInvitation.delete({
          where: { id: invitation.id },
        });
      }

      await prisma.teamMember.create({
        data: {
          teamId: teamId,
          userId: session!.user.id,
          role: "MEMBER",
        },
      });
    } catch (error) {
      console.error("Failed to join team:", error);
      throw error; // Biarkan error asli dilempar
    }

    // Jangan throw error setelah redirect
    redirect(`/dashboard/teams/${teamId}`);
  }

  return (
    <div className='w-full max-w-md mx-auto p-8 text-center'>
      <h2 className='text-2xl font-bold mb-4'>Join Team: {team.name}</h2>
      <p className='mb-6'>You&apos;ve been invited to join this team.</p>
      <form action={joinTeam}>
        <Button type='submit'>Join Team</Button>
      </form>
    </div>
  );
}

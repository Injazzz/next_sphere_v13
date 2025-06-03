/* eslint-disable @typescript-eslint/no-unused-vars */
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailServerAction } from "@/lib/server/actions/send-mail.action";
import { createTeamInvitation } from "@/lib/server/email/invitation-utils";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// POST invite member to team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = (await params).id;
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    // Check if user is the leader of this team
    const teamLeader = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
        role: "LEADER",
      },
    });

    if (!teamLeader) {
      return NextResponse.json(
        { error: "Only team leader can invite members" },
        { status: 403 }
      );
    }

    // Get team details
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { name: true },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if email is registered
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User with this email is not registered" },
        { status: 400 }
      );
    }

    // Check if user is already in the team
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already in the team" },
        { status: 400 }
      );
    }

    // Check if user is already in another team
    const userInOtherTeam = await prisma.teamMember.findFirst({
      where: {
        userId: user.id,
        NOT: {
          teamId,
        },
      },
    });

    if (userInOtherTeam) {
      return NextResponse.json(
        { error: "User is already in another team" },
        { status: 400 }
      );
    }

    const invitation = await createTeamInvitation(teamId, email);

    // Send invitation email dengan token
    const inviteLink = `${process.env.NEXT_PUBLIC_API_URL}/dashboard/teams/${teamId}/join?token=${invitation.token}`;

    await sendEmailServerAction({
      to: email,
      subject: "Team Invitation",
      meta: {
        title: "You've been invited to join a team",
        description: `You've been invited to join the team "${team.name}". This invitation will expire in 15 minutes.`,
        link: inviteLink,
        buttonText: "Join Team",
        footer:
          "This invitation will expire at " +
          invitation.expiresAt.toLocaleTimeString(),
      },
    });

    return NextResponse.json(
      { message: "Invitation sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}

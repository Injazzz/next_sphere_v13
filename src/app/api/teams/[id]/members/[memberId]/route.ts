/* eslint-disable @typescript-eslint/no-unused-vars */
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailServerAction } from "@/lib/server/actions/send-mail.action";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// PATCH update member role (for leadership transfer)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = (await params).id;
  const memberId = (await params).memberId;
  const { role } = await request.json();

  try {
    // Check if current user is the leader
    const currentLeader = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
        role: "LEADER",
      },
    });

    if (!currentLeader) {
      return NextResponse.json(
        { error: "Only team leader can transfer leadership" },
        { status: 403 }
      );
    }

    // Check if target member exists
    const targetMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: memberId,
      },
    });

    if (!targetMember) {
      return NextResponse.json(
        { error: "Member not found in this team" },
        { status: 404 }
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

    // Update roles
    await prisma.$transaction([
      // Demote current leader to member
      prisma.teamMember.update({
        where: {
          id: currentLeader.id,
        },
        data: {
          role: "MEMBER",
        },
      }),
      // Promote new member to leader
      prisma.teamMember.update({
        where: {
          id: targetMember.id,
        },
        data: {
          role: "LEADER",
        },
      }),
    ]);

    // Send email to new leader
    const newLeader = await prisma.user.findUnique({
      where: { id: memberId },
    });

    if (newLeader) {
      await sendEmailServerAction({
        to: newLeader.email,
        subject: "You are now the team leader",
        meta: {
          title: "Leadership Transfer",
          description: `You have been assigned as the new leader of the team "${team.name}"by ${session.user.name || session.user.email}.`,
          link: `${process.env.NEXT_PUBLIC_API_URL}/dashboard/teams/${teamId}`,
          buttonText: "View Team",
        },
      });
    }

    return NextResponse.json(
      { message: "Leadership transferred successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to transfer leadership" },
      { status: 500 }
    );
  }
}

// DELETE remove member from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = (await params).id;
  const memberId = (await params).memberId;

  try {
    // Check if current user is the leader or the member themselves
    const currentUserMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
      },
    });

    if (!currentUserMember) {
      return NextResponse.json(
        { error: "You are not a member of this team" },
        { status: 403 }
      );
    }

    // If not the leader and not trying to remove themselves
    if (
      currentUserMember.role !== "LEADER" &&
      currentUserMember.userId !== memberId
    ) {
      return NextResponse.json(
        { error: "Only team leader can remove members" },
        { status: 403 }
      );
    }

    // If leader is trying to remove themselves (must transfer leadership first)
    if (
      currentUserMember.role === "LEADER" &&
      currentUserMember.userId === memberId
    ) {
      return NextResponse.json(
        { error: "Transfer leadership before leaving the team" },
        { status: 400 }
      );
    }

    await prisma.teamMember.delete({
      where: {
        id: memberId,
      },
    });

    return NextResponse.json(
      { message: "Member removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}

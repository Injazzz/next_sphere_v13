/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/teams/[teamId]/members/me/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
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

  try {
    // Find the member record
    const member = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "You are not a member of this team" },
        { status: 403 }
      );
    }

    // Check if user is the leader
    if (member.role === "LEADER") {
      // Leader can't leave without transferring leadership first
      // Check if there are other members
      const otherMembers = await prisma.teamMember.findMany({
        where: {
          teamId,
          NOT: {
            userId: session.user.id,
          },
        },
      });

      if (otherMembers.length > 0) {
        return NextResponse.json(
          {
            error:
              "Transfer leadership before leaving the team or delete the team",
          },
          { status: 400 }
        );
      } else {
        // If no other members, delete the team
        await prisma.team.delete({
          where: { id: teamId },
        });
        return NextResponse.json(
          { message: "Team deleted successfully" },
          { status: 200 }
        );
      }
    }

    // Regular member can leave
    await prisma.teamMember.delete({
      where: {
        id: member.id,
      },
    });

    return NextResponse.json(
      { message: "Left team successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to leave team" },
      { status: 500 }
    );
  }
}

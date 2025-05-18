/* eslint-disable @typescript-eslint/no-unused-vars */
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// GET all teams for current user
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(teams);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

// POST create new team
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json(
      { error: "Team name is required" },
      { status: 400 }
    );
  }

  // Check if user is already in a team
  const existingTeam = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
    },
  });

  if (existingTeam) {
    return NextResponse.json(
      { error: "You can only be in one team at a time" },
      { status: 400 }
    );
  }

  try {
    const team = await prisma.team.create({
      data: {
        name,
        members: {
          create: {
            userId: session.user.id,
            role: "LEADER",
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}

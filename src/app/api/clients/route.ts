import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/server-utils";
import { headers } from "next/headers";
import { NextResponse, NextRequest } from "next/server";

// GET all clients (with filtering, sorting, and pagination)
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const sortBy = searchParams.get("sortBy") || "name";
  const sortOrder = searchParams.get("sortOrder") || "asc";
  const myClientsOnly = searchParams.get("myClientsOnly") === "true";

  const where = {
    AND: [
      {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { companyName: { contains: search, mode: "insensitive" as const } },
        ],
      },
      myClientsOnly ? { createdById: session.user.id } : {},
    ],
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.client.count({ where }),
  ]);

  return NextResponse.json({
    data: clients,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST create new client
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  try {
    // Check if email already exists in client or user table
    if (body.email) {
      // Check in client table
      const existingClientWithEmail = await prisma.client.findFirst({
        where: {
          email: body.email,
        },
      });

      // Check in user table
      const existingUserWithEmail = await prisma.user.findFirst({
        where: {
          email: body.email,
        },
      });

      // If email exists in either table, return error
      if (existingClientWithEmail || existingUserWithEmail) {
        return NextResponse.json(
          { error: "Email already exists in either client or user records" },
          { status: 409 } // 409 Conflict status code
        );
      }
    }

    // If email doesn't exist, create the client
    const client = await prisma.client.create({
      data: {
        ...body,
        token: generateToken(), // Add this line
        createdById: session.user.id,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 400 }
    );
  }
}

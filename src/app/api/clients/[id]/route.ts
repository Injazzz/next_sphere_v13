/* eslint-disable @typescript-eslint/no-unused-vars */
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// GET single client
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const param = await params;
  const userId = param.id;

  const client = await prisma.client.findUnique({
    where: { id: userId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json(client);
}

// PATCH update client
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const param = await params;
  const userId = param.id;

  // Check if client exists and belongs to user
  const existingClient = await prisma.client.findUnique({
    where: { id: userId },
  });

  if (!existingClient) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  if (existingClient.createdById !== session.user.id) {
    return NextResponse.json(
      { error: "You can only update your own clients" },
      { status: 403 }
    );
  }

  try {
    const client = await prisma.client.update({
      where: { id: userId },
      data: body,
    });

    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 400 }
    );
  }
}

// DELETE client
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const param = await params;
  const userId = param.id;

  // Check if client exists and belongs to user
  const existingClient = await prisma.client.findUnique({
    where: { id: userId },
  });

  if (!existingClient) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  if (existingClient.createdById !== session.user.id) {
    return NextResponse.json(
      { error: "You can only delete your own clients" },
      { status: 403 }
    );
  }

  try {
    await prisma.client.delete({
      where: { id: userId },
    });

    return NextResponse.json(
      { message: "Client deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 400 }
    );
  }
}

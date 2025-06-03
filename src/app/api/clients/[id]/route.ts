/* eslint-disable @typescript-eslint/no-unused-vars */
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET single client
export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params; // Await params karena sekarang Promise

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await prisma.client.findUnique({
    where: { id }, // Gunakan id yang sudah di-destructure
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
};

// PATCH update client
export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params; // Await params

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Check if client exists and belongs to user
  const existingClient = await prisma.client.findUnique({
    where: { id }, // Gunakan id yang sudah di-destructure
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
      where: { id }, // Gunakan id yang sudah di-destructure
      data: body,
    });
    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 400 }
    );
  }
};

// DELETE client
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params; // Await params

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if client exists and belongs to user
  const existingClient = await prisma.client.findUnique({
    where: { id }, // Gunakan id yang sudah di-destructure
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
      where: { id }, // Gunakan id yang sudah di-destructure
    });
    return NextResponse.json(
      { message: "Client deleted successfully" },
      { status: 204 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 400 }
    );
  }
};

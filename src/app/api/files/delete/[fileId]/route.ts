import { auth } from "@/lib/auth";
import { verifyGuestSession } from "@/lib/auth-guest";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse, NextRequest } from "next/server";
import * as fs from "fs";
import path from "path";

async function getAuthenticatedEntity() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    return {
      type: "user" as const,
      id: session.user.id,
      entity: session.user,
    };
  }

  const client = await verifyGuestSession();
  if (client) {
    return {
      type: "client" as const,
      id: client.id,
      entity: client,
    };
  }

  return null;
}

async function checkFileAccess(
  fileId: string,
  fileType: "document" | "response",
  entityType: "user" | "client",
  entityId: string
) {
  if (fileType === "document") {
    const file = await prisma.documentFile.findUnique({
      where: { id: fileId },
      include: {
        document: {
          include: {
            team: {
              include: {
                members: {
                  where: { userId: entityId },
                  select: { userId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!file) return false;

    if (entityType === "user") {
      return (
        file.document.createdById === entityId ||
        file.document.team?.members.some((m) => m.userId === entityId)
      );
    }
    return false;
  } else {
    const file = await prisma.documentResponse.findUnique({
      where: { id: fileId },
      include: {
        document: true,
      },
    });

    if (!file) return false;

    if (entityType === "client") {
      return file.document.clientId === entityId;
    }
    return false;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const fileType = searchParams.get("fileType") as "document" | "response";

    // Validate fileType parameter
    if (!fileType || !["document", "response"].includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid or missing fileType parameter" },
        { status: 400 }
      );
    }

    const auth = await getAuthenticatedEntity();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = (await params).fileId; // Fixed: Remove await

    // Check file access permissions
    const hasAccess = await checkFileAccess(
      fileId,
      fileType,
      auth.type,
      auth.id
    );
    if (!hasAccess) {
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
    }

    // Get file record from database
    let fileRecord;
    if (fileType === "document") {
      fileRecord = await prisma.documentFile.findUnique({
        where: { id: fileId },
      });
    } else {
      fileRecord = await prisma.documentResponse.findUnique({
        where: { id: fileId },
      });
    }

    if (!fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), fileRecord.url); // Fixed: Remove "public"
    try {
      await fs.promises.unlink(filePath);
    } catch (err) {
      console.error("Error deleting file from filesystem:", err);
      // Continue with database deletion even if file deletion fails
    }

    // Delete record from database
    if (fileType === "document") {
      await prisma.documentFile.delete({
        where: { id: fileId },
      });
    } else {
      await prisma.documentResponse.delete({
        where: { id: fileId },
      });
    }

    return NextResponse.json(
      { message: "File deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}

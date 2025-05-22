import { auth } from "@/lib/auth";
import { verifyGuestSession } from "@/lib/auth-guest";
import { prisma } from "@/lib/prisma";
import { decryptFile } from "@/lib/file-encryption";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import * as fs from "fs";
import path from "path";

// Helper function to get authenticated user/client
async function getAuthenticatedEntity() {
  // Try user authentication first
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

  // Try client authentication
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

// Helper function to check file access permissions
async function checkFileAccess(
  fileType: "document" | "response",
  fileId: string,
  entityType: "user" | "client",
  entityId: string
) {
  if (fileType === "document") {
    const file = await prisma.documentFile.findUnique({
      where: { id: fileId },
      include: {
        document: {
          select: {
            id: true,
            createdById: true,
            clientId: true,
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

    if (!file) return null;

    // Check access permissions
    let hasAccess = false;
    if (entityType === "user") {
      // User can access if they created the document or are team member
      hasAccess =
        file.document.createdById === entityId ||
        (file.document.team?.members.some((m) => m.userId === entityId) ??
          false);
    } else {
      // Client can access if document belongs to them
      hasAccess = file.document.clientId === entityId;
    }

    return hasAccess ? file : null;
  } else if (fileType === "response") {
    const file = await prisma.documentResponse.findUnique({
      where: { id: fileId },
      include: {
        document: {
          select: {
            id: true,
            createdById: true,
            clientId: true,
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

    if (!file) return null;

    // Check access permissions
    let hasAccess = false;
    if (entityType === "user") {
      // User can access if they created the document or are team member
      hasAccess =
        file.document.createdById === entityId ||
        (file.document.team?.members.some((m) => m.userId === entityId) ??
          false);
    } else {
      // Client can access if document belongs to them
      hasAccess = file.document.clientId === entityId;
    }

    return hasAccess ? file : null;
  }

  return null;
}
// Helper function to get content type from file extension
function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
  };
  return contentTypes[ext] || "application/octet-stream";
}

export async function GET(
  request: Request,
  { params }: { params: { type: string; id: string } }
) {
  try {
    // Get authenticated entity
    const auth = await getAuthenticatedEntity();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, id } = await params;

    // Validate file type
    if (!["document", "response"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid file type. Must be 'document' or 'response'" },
        { status: 400 }
      );
    }

    // Check file access and get file info
    const fileInfo = await checkFileAccess(
      type as "document" | "response",
      id,
      auth.type,
      auth.id
    );

    if (!fileInfo) {
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
    }

    // Construct file path
    const filePath = path.join(process.cwd(), fileInfo.url.substring(1)); // Remove leading '/'

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "File not found on disk" },
        { status: 404 }
      );
    }

    // Read file from disk
    const fileData = await fs.promises.readFile(filePath);

    // Decrypt if file is encrypted
    let responseData: Buffer;
    if (fileInfo.encrypted && fileInfo.iv) {
      responseData = await decryptFile(fileData, fileInfo.iv);
    } else {
      responseData = fileData;
    }

    // Get query parameters for display options
    const url = new URL(request.url);
    const isPreview = url.searchParams.get("preview") === "true";
    const disposition = isPreview ? "inline" : "attachment";

    // Determine content type
    const contentType = getContentType(fileInfo.name);

    // Return file response
    return new NextResponse(responseData, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(fileInfo.name)}"`,
        "Content-Length": responseData.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}

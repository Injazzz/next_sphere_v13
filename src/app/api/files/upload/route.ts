import { auth } from "@/lib/auth";
import { verifyGuestSession } from "@/lib/auth-guest";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import { encryptFile } from "@/lib/file-encryption";
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

// Helper function to check access permissions
async function checkDocumentAccess(
  documentId: string,
  entityType: "user" | "client",
  entityId: string
) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
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
  });

  if (!document) return false;

  if (entityType === "user") {
    // User can access if they created it or are team member
    return (
      document.createdById === entityId ||
      document.team?.members.some((m) => m.userId === entityId)
    );
  } else {
    // Client can access if document belongs to them
    return document.clientId === entityId;
  }
}

// Validate files
function validateFiles(files: File[]) {
  const errors: string[] = [];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  files.forEach((file) => {
    if (file.size > maxSize) {
      errors.push(`File "${file.name}" exceeds 5MB limit`);
    }
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File "${file.name}" has unsupported type: ${file.type}`);
    }
  });

  return errors;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated entity
    const auth = await getAuthenticatedEntity();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const documentId = formData.get("documentId") as string;
    const fileType = formData.get("fileType") as "document" | "response";
    const files = formData.getAll("files") as File[];

    // Validate required fields
    if (!documentId || !fileType || files.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: documentId, fileType, or files" },
        { status: 400 }
      );
    }

    // Validate file type parameter
    if (!["document", "response"].includes(fileType)) {
      return NextResponse.json(
        { error: "fileType must be 'document' or 'response'" },
        { status: 400 }
      );
    }

    // Check document access permissions
    const hasAccess = await checkDocumentAccess(documentId, auth.type, auth.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      );
    }

    // Validate business logic
    if (fileType === "document" && auth.type === "client") {
      return NextResponse.json(
        { error: "Clients cannot upload document files" },
        { status: 403 }
      );
    }

    if (fileType === "response" && auth.type === "user") {
      return NextResponse.json(
        { error: "Users cannot upload response files" },
        { status: 403 }
      );
    }

    // Validate files
    const validationErrors = validateFiles(files);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "File validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    // Determine upload directory based on file type
    const uploadDir = path.join(
      process.cwd(),
      "attachments",
      "documents",
      fileType === "document" ? "uploads" : "responses"
    );

    // Ensure upload directory exists
    await fs.promises.mkdir(uploadDir, { recursive: true });

    // Process and save files
    const savedFiles = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Encrypt the file
        const { encryptedData, iv } = await encryptFile(buffer);

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const fileName = `${documentId}-${timestamp}-${randomString}-${file.name}`;
        const filePath = path.join(uploadDir, fileName);

        // Save to filesystem
        await fs.promises.writeFile(filePath, encryptedData);

        // Save file record to appropriate table
        if (fileType === "document") {
          return prisma.documentFile.create({
            data: {
              name: file.name,
              url: `/attachments/documents/uploads/${fileName}`,
              size: file.size,
              encrypted: true,
              documentId: documentId,
              iv: Buffer.from(iv).toString("hex"),
            },
          });
        } else {
          return prisma.documentResponse.create({
            data: {
              name: file.name,
              url: `/attachments/documents/responses/${fileName}`,
              size: file.size,
              encrypted: true,
              documentId: documentId,
              iv: Buffer.from(iv).toString("hex"),
            },
          });
        }
      })
    );

    return NextResponse.json(
      {
        message: "Files uploaded successfully",
        files: savedFiles,
        count: savedFiles.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}

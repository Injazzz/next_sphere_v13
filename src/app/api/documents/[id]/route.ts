import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { calculateDocumentStatus } from "@/lib/utils";
import * as fs from "fs";
import { DocumentFlow, DocumentType } from "@/generated/prisma";
import { encryptFile } from "@/lib/file-encryption";
import path from "path";

async function updateDocumentStatus(documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) return null;

  const calculatedStatus = calculateDocumentStatus(document);

  // Only update if status is different and not a manual status
  if (
    document.status !== calculatedStatus &&
    !["COMPLETED", "APPROVED"].includes(document.status)
  ) {
    return await prisma.document.update({
      where: { id: documentId },
      data: { status: calculatedStatus },
    });
  }

  return document;
}

// GET single document
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

  const documentId = (await params).id;

  try {
    await updateDocumentStatus(documentId);

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        client: true,
        files: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check access - creator or team leader
    const isCreator = document.createdById === session.user.id;
    const isTeamLeader = document.teamId
      ? await prisma.teamMember.findFirst({
          where: {
            teamId: document.teamId,
            userId: session.user.id,
            role: "LEADER",
          },
        })
      : false;

    if (!isCreator && !isTeamLeader) {
      return NextResponse.json(
        { error: "You don't have access to this document" },
        { status: 403 }
      );
    }

    const calculatedStatus = calculateDocumentStatus(document);

    return NextResponse.json({
      ...document,
      status: calculatedStatus,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

// PATCH update document
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
  const documentId = (await params).id;
  const formData = await request.formData();
  console.log(formData);

  try {
    // Check if document exists and user has access
    const existingDocument = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!existingDocument) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Only creator can update
    if (existingDocument.createdById !== session.user.id) {
      return NextResponse.json(
        { error: "You only can edit your own document." },
        { status: 403 }
      );
    }

    // Get form data
    const title = formData.get("title") as string;
    const type = formData.get("type") as string;
    const flow = formData.get("flow") as string;
    const description = formData.get("description") as string;
    const clientId = formData.get("clientId") as string;
    const teamId = formData.get("teamId") as string | null;
    const startTrackAt = formData.get("startTrackAt") as string;
    const endTrackAt = formData.get("endTrackAt") as string;
    const files = formData.getAll("files") as File[];
    const existingFiles = formData.getAll("existingFiles") as string[];

    await updateDocumentStatus(documentId);

    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        title,
        type: type as DocumentType,
        flow: flow as DocumentFlow,
        description,
        clientId,
        teamId: teamId || null,
        startTrackAt: new Date(startTrackAt),
        endTrackAt: new Date(endTrackAt),
      },
    });

    // Handle files
    // First, delete any files not in the existingFiles list
    const currentFiles = await prisma.documentFile.findMany({
      where: { documentId },
    });

    const filesToDelete = currentFiles.filter(
      (file) => !existingFiles.includes(file.id)
    );

    await Promise.all(
      filesToDelete.map(async (file) => {
        // Delete from filesystem
        try {
          const filePath = path.join(process.cwd(), file.url);
          await fs.promises.unlink(filePath);
        } catch (error) {
          console.error(`Error deleting file ${file.url}:`, error);
        }
        // Delete from database
        await prisma.documentFile.delete({ where: { id: file.id } });
      })
    );

    // Ensure upload folder exists
    const uploadDir = path.join(
      process.cwd(),
      "attachments",
      "documents",
      "uploads"
    );
    await fs.promises.mkdir(uploadDir, { recursive: true });

    // Add new files
    await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Encrypt the file
        const { encryptedData, iv } = await encryptFile(buffer);

        // Save to filesystem
        const fileName = `${documentId}-${Date.now()}-${file.name}`;
        const filePath = path.join(uploadDir, fileName);
        await fs.promises.writeFile(filePath, encryptedData);

        // Save file record
        return prisma.documentFile.create({
          data: {
            name: file.name,
            url: `/attachments/documents/uploads/${fileName}`,
            size: file.size,
            encrypted: true,
            documentId: documentId,
            iv: Buffer.from(iv).toString("hex"), // Store IV for later decryption
          },
        });
      })
    );

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

// DELETE document
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

  const documentId = (await params).id;

  try {
    // Check if document exists and user has access
    const existingDocument = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!existingDocument) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Only creator can delete
    if (existingDocument.createdById !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete documents you created" },
        { status: 403 }
      );
    }

    // Delete associated files first
    await prisma.documentFile.deleteMany({
      where: { documentId },
    });

    // Then delete the document
    await prisma.document.delete({
      where: { id: documentId },
    });

    return NextResponse.json(
      { message: "Document deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}

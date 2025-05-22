import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { calculateDocumentStatus } from "@/lib/utils";
import * as fs from "fs";
import { DocumentFlow, DocumentType } from "@/generated/prisma";
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
        responseFile: true,
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

    const body = await request.json();

    const {
      title,
      type,
      flow,
      description,
      clientId,
      teamId,
      startTrackAt,
      endTrackAt,
      existingFileIds,
    } = body;

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

    // Handle existing files - remove files not in existingFileIds
    if (existingFileIds && Array.isArray(existingFileIds)) {
      const currentFiles = await prisma.documentFile.findMany({
        where: { documentId },
      });

      const filesToDelete = currentFiles.filter(
        (file) => !existingFileIds.includes(file.id)
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
    }

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

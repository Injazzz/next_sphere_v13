import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import * as fs from "fs";
import { encryptFile } from "@/lib/file-encryption";
import { sendEmailServerAction } from "@/lib/server/actions/send-mail.action";
import { calculateDocumentStatus } from "@/lib/utils";
import {
  DocumentFlow,
  DocumentStatus,
  DocumentType,
  Prisma,
} from "@/generated/prisma";
import path from "path";

// GET all documents (with filtering, sorting, and pagination)
export async function GET(request: Request) {
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
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const teamDocuments = searchParams.get("teamDocuments") === "true";

  // Check if user is a team leader
  const isTeamLeader = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
      role: "LEADER",
    },
  });

  const where: Prisma.DocumentWhereInput = {
    AND: [
      {
        OR: [
          { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
          {
            description: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      },
      type ? { type: type as DocumentType } : {},
      status ? { status: status as DocumentStatus } : {},
      teamDocuments && isTeamLeader
        ? {
            OR: [
              { createdById: session.user.id },
              { team: { members: { some: { userId: session.user.id } } } },
            ],
          }
        : { createdById: session.user.id },
    ],
  };

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        client: {
          select: {
            id: true,
            companyName: true, // Pastikan ini di-include
          },
        },
        files: true,
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
    }),
    prisma.document.count({ where }),
  ]);

  const updatedDocuments = await Promise.all(
    documents.map(async (doc) => {
      const calculatedStatus = calculateDocumentStatus(doc);
      // Jika status berbeda, update di database
      if (
        calculatedStatus !== doc.status &&
        !["COMPLETED", "APPROVED"].includes(doc.status)
      ) {
        try {
          await prisma.document.update({
            where: { id: doc.id },
            data: { status: calculatedStatus },
          });
          return { ...doc, status: calculatedStatus };
        } catch (error) {
          console.error(
            `Failed to update status for document ${doc.id}:`,
            error
          );
          return doc;
        }
      }
      return doc;
    })
  );

  return NextResponse.json({
    data: updatedDocuments,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      isTeamLeader: !!isTeamLeader, // Include team leader status in the response
    },
  });
}

// POST create new document
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const type = formData.get("type") as string;
  const flow = formData.get("flow") as string;
  const description = formData.get("description") as string;
  const clientId = formData.get("clientId") as string;
  const startTrackAt = formData.get("startTrackAt") as string;
  const endTrackAt = formData.get("endTrackAt") as string;
  const teamId = formData.get("teamId") as string | null;
  const files = formData.getAll("files") as File[];
  const initialStatus =
    (formData.get("initialStatus") as DocumentStatus) || "DRAFT";

  // Validate required fields
  if (!title || !type || !flow || !clientId || !startTrackAt || !endTrackAt) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Validate file size and type
  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: `File ${file.name} exceeds 5MB limit` },
        { status: 400 }
      );
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: `File ${file.name} must be a PDF` },
        { status: 400 }
      );
    }
  }

  try {
    // Create document first
    const document = await prisma.document.create({
      data: {
        title,
        type: type as DocumentType,
        flow: flow as DocumentFlow,
        description,
        startTrackAt: new Date(startTrackAt),
        endTrackAt: new Date(endTrackAt),
        createdById: session.user.id,
        clientId,
        teamId: teamId || null,
        status: initialStatus as DocumentStatus, // Set initial status
      },
      include: {
        client: true,
      },
    });

    // Ensure upload folder exists
    const uploadDir = path.join(
      process.cwd(),
      "attachments",
      "documents",
      "uploads"
    );
    await fs.promises.mkdir(uploadDir, { recursive: true });

    // Process and save files
    const savedFiles = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        // Encrypt the file
        const { encryptedData, iv } = await encryptFile(buffer);
        // Save to filesystem
        const fileName = `${document.id}-${Date.now()}-${file.name}`;
        const filePath = path.join(uploadDir, fileName);
        await fs.promises.writeFile(filePath, encryptedData);
        // Save file record
        return prisma.documentFile.create({
          data: {
            name: file.name,
            url: `/attachments/documents/uploads/${fileName}`,
            size: file.size,
            encrypted: true,
            documentId: document.id,
            iv: Buffer.from(iv).toString("hex"), // Store IV for later decryption
          },
        });
      })
    );

    // Send email to client
    await sendEmailServerAction({
      to: document.client.email,
      subject: `New Document Created: ${document.title}`,
      meta: {
        title: "New Document Created",
        description: `A new document (${document.type}) has been created for you. Document title: ${document.title}`,
        link: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${document.id}`,
        buttonText: "View Document",
        footer: "This is an automated message, please do not reply.",
      },
    });

    return NextResponse.json(
      { ...document, files: savedFiles },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}

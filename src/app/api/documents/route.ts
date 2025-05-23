import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { sendEmailServerAction } from "@/lib/server/actions/send-mail.action";
import { calculateDocumentStatus } from "@/lib/utils";
import {
  DocumentFlow,
  DocumentStatus,
  DocumentType,
  Prisma,
} from "@/generated/prisma";

// Helper function to calculate remaining time in milliseconds
const calculateRemainingTime = (endTrackAt: Date): number => {
  const now = new Date();
  return endTrackAt.getTime() - now.getTime();
};

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

  // Handle sorting - special case for remainingTime
  let orderBy: Prisma.DocumentOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  // If sorting by remainingTime, we'll sort in memory after fetching
  const isRemainingTimeSort = sortBy === "remainingTime";
  if (isRemainingTimeSort) {
    // Default to createdAt for database query, we'll sort by remainingTime after
    orderBy = { createdAt: "desc" };
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      skip: isRemainingTimeSort ? 0 : (page - 1) * limit, // Get all if sorting by remainingTime
      take: isRemainingTimeSort ? undefined : limit, // Get all if sorting by remainingTime
      orderBy,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
          },
        },
        files: true,
        responseFile: true,
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
      // Update status if different and not in final states
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

  // Add remaining time to each document
  const documentsWithRemainingTime = updatedDocuments.map((doc) => ({
    ...doc,
    remainingTime: calculateRemainingTime(doc.endTrackAt),
  }));

  let finalDocuments = documentsWithRemainingTime;

  // Handle remainingTime sorting
  if (isRemainingTimeSort) {
    finalDocuments.sort((a, b) => {
      const timeA = a.remainingTime;
      const timeB = b.remainingTime;

      if (sortOrder === "desc") {
        return timeB - timeA;
      } else {
        return timeA - timeB;
      }
    });

    // Apply pagination after sorting
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    finalDocuments = finalDocuments.slice(startIndex, endIndex);
  }

  return NextResponse.json({
    data: finalDocuments,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      isTeamLeader: !!isTeamLeader,
    },
  });
}

// POST create new document (without files - files handled separately)
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      type,
      flow,
      description,
      clientId,
      startTrackAt,
      endTrackAt,
      teamId,
      initialStatus = "DRAFT",
    } = body;

    // Validate required fields
    if (!title || !type || !flow || !clientId || !startTrackAt || !endTrackAt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create document
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
        status: initialStatus as DocumentStatus,
      },
      include: {
        client: true,
        files: true,
        responseFile: true,
      },
    });

    // Get client token for email
    const clientWithToken = await prisma.client.findUnique({
      where: { id: clientId },
      select: { token: true },
    });

    const documentUrl = `${process.env.NEXT_PUBLIC_API_URL}/guest/documents/${document.id}`;

    // Send email to client
    await sendEmailServerAction({
      to: document.client.email,
      subject: `New Document Created: ${document.title}`,
      meta: {
        title: "New Document Created",
        description: `A new document (${document.type}) has been created for you. Document title: ${document.title}`,
        link: documentUrl,
        buttonText: "View Document",
        footer: `Your access token: ${clientWithToken?.token}`,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}

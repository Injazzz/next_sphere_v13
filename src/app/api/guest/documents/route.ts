import { NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth-guest";
import { prisma } from "@/lib/prisma";
import { calculateDocumentStatus } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const client = await verifyGuestSession();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse URL parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Build where clause for filtering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      clientId: client.id,
    };

    // Add search filter if provided
    if (search) {
      whereClause.OR = [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.document.count({
      where: whereClause,
    });

    // Get documents with pagination
    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        files: true,
        responseFile: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limit,
    });

    // Calculate current status for each document
    let documentsWithStatus = documents.map((doc) => ({
      ...doc,
      computedStatus: calculateDocumentStatus({
        status: doc.status,
        startTrackAt: doc.startTrackAt,
        endTrackAt: doc.endTrackAt,
        completedAt: doc.completedAt,
        approvedAt: doc.approvedAt,
      }),
    }));

    // Apply status filter after computing status (since it's calculated)
    if (status && status !== "all") {
      documentsWithStatus = documentsWithStatus.filter(
        (doc) => doc.computedStatus === status
      );
    }

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(
      {
        documents: documentsWithStatus,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Documents fetch error:", error);
    return NextResponse.json(
      { error: "An error occurred fetching documents" },
      { status: 500 }
    );
  }
}

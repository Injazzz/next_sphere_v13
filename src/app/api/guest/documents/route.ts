import { NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth-guest";
import { prisma } from "@/lib/prisma";
import { calculateDocumentStatus } from "@/lib/utils";

export async function GET() {
  try {
    const client = await verifyGuestSession();

    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all documents for this client
    const documents = await prisma.document.findMany({
      where: {
        clientId: client.id,
      },
      include: {
        files: true,
        responseFile: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate current status for each document
    const documentsWithStatus = documents.map((doc) => ({
      ...doc,
      computedStatus: calculateDocumentStatus({
        status: doc.status,
        startTrackAt: doc.startTrackAt,
        endTrackAt: doc.endTrackAt,
        completedAt: doc.completedAt,
        approvedAt: doc.approvedAt,
      }),
    }));

    return NextResponse.json(
      { documents: documentsWithStatus },
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

import { NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth-guest";
import { prisma } from "@/lib/prisma";
import { calculateDocumentStatus } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await verifyGuestSession();

    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = (await params).id;

    // Get document with files and response files
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        clientId: client.id, // Ensure it belongs to this client
      },
      include: {
        files: true,
        responseFile: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Calculate current status
    const documentWithStatus = {
      ...document,
      computedStatus: calculateDocumentStatus({
        status: document.status,
        startTrackAt: document.startTrackAt,
        endTrackAt: document.endTrackAt,
        completedAt: document.completedAt,
        approvedAt: document.approvedAt,
      }),
    };

    return NextResponse.json({ document: documentWithStatus }, { status: 200 });
  } catch (error) {
    console.error("Document fetch error:", error);
    return NextResponse.json(
      { error: "An error occurred fetching document" },
      { status: 500 }
    );
  }
}

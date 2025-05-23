// Updated status route with proper validation using calculated status
import { DocumentStatus } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailServerAction } from "@/lib/server/actions/send-mail.action";
import { calculateDocumentStatus } from "@/lib/utils";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
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
  let requestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    console.error("Error parsing request body:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { status } = requestBody;

  // Log for debugging
  console.log("Document ID:", documentId);
  console.log("Requested Status:", status);

  try {
    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        client: true,
        createdBy: true,
        team: {
          include: {
            members: {
              where: { role: "LEADER" },
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      console.error("Document not found:", documentId);
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // IMPORTANT: Calculate the current status based on dates
    const calculatedStatus = calculateDocumentStatus(document);
    console.log("DB status:", document.status);
    console.log("Calculated status:", calculatedStatus);

    // Log current status for debugging
    console.log("Current document status:", document.status);

    // Validate status transition - USE CALCULATED STATUS INSTEAD OF DB STATUS
    const validTransitions: Record<DocumentStatus, DocumentStatus[]> = {
      DRAFT: ["ACTIVE"],
      ACTIVE: ["COMPLETED", "WARNING", "OVERDUE"],
      WARNING: ["COMPLETED", "OVERDUE"],
      OVERDUE: ["COMPLETED"],
      COMPLETED: ["APPROVED"],
      APPROVED: [],
    };

    // Log validation transition for debugging
    console.log("Valid transitions:", validTransitions[calculatedStatus]);
    console.log(
      "Is transition valid:",
      validTransitions[calculatedStatus].includes(status as DocumentStatus)
    );

    // Use the calculated status for validation, not the database status
    if (
      !validTransitions[calculatedStatus].includes(status as DocumentStatus)
    ) {
      return NextResponse.json(
        {
          error: `Invalid status transition from ${calculatedStatus} to ${status}`,
        },
        { status: 400 }
      );
    }

    // Check permissions
    if (status === "APPROVED") {
      // Only team leader can approve
      const isTeamLeader = document.team?.members.some(
        (member) => member.userId === session.user.id
      );
      console.log("Is team leader:", isTeamLeader);
      if (!isTeamLeader) {
        return NextResponse.json(
          { error: "Only team leaders can approve documents" },
          { status: 403 }
        );
      }
    } else {
      // Only creator can change other statuses
      console.log("Document creator ID:", document.createdById);
      console.log("Current user ID:", session.user.id);
      if (document.createdById !== session.user.id) {
        return NextResponse.json(
          { error: "You can only update documents you created" },
          { status: 403 }
        );
      }
    }

    // Update document status
    const updateData: {
      status: DocumentStatus;
      updatedAt: Date;
      completedAt?: Date;
      approvedAt?: Date;
    } = {
      status: status as DocumentStatus,
      updatedAt: new Date(),
    };

    if (status === "COMPLETED") {
      updateData.completedAt = new Date();
    } else if (status === "APPROVED") {
      updateData.approvedAt = new Date();
    }

    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
      include: {
        client: true,
      },
    });

    // Send notification email
    let emailSubject = "";
    let emailDescription = "";
    if (status === "COMPLETED") {
      emailSubject = `Document Completed: ${document.title}`;
      emailDescription = `The document (${document.type}) has been marked as completed by ${document.createdBy.name}.`;
    }

    if (emailSubject && emailDescription && document.client?.email) {
      try {
        await sendEmailServerAction({
          to: document.client.email,
          subject: emailSubject,
          meta: {
            title: emailSubject,
            description: emailDescription,
            link: `${process.env.NEXT_PUBLIC_API_URL}/guests/documents/${document.id}`,
            buttonText: "View Document",
            footer: "This is an automated message, please do not reply.",
          },
        });
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Continue even if email fails
      }
    }

    console.log("Document updated successfully");
    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error("Error updating document status:", error);
    return NextResponse.json(
      {
        error: "Failed to update document status",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

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
  const { status } = await request.json();

  try {
    // Verifikasi dokumen milik user atau team user
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        team: {
          include: {
            members: {
              where: { userId: session.user.id },
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

    // Hanya creator atau team leader yang bisa update status
    const isCreator = document.createdById === session.user.id;
    const isTeamLeader = document.team?.members.some(
      (member) => member.role === "LEADER"
    );

    if (!isCreator && !isTeamLeader) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update status
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        status,
        ...(status === "COMPLETED" && { completedAt: new Date() }),
        ...(status === "APPROVED" && { approvedAt: new Date() }),
      },
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error("Error updating document status:", error);
    return NextResponse.json(
      { error: "Failed to update document status" },
      { status: 500 }
    );
  }
}

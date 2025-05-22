import { NextRequest, NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth-guest";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { encryptFile } from "@/lib/file-encryption";
import { sendEmailServerAction } from "@/lib/server/actions/send-mail.action";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await verifyGuestSession();

    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = (await params).id;

    // Check if document exists and belongs to client
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        clientId: client.id,
      },
      include: {
        createdBy: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Parse form data (multipart/form-data with file)
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Create directory if it doesn't exist
    const uploadDir = path.join(
      process.cwd(),
      "attachments",
      "documents",
      "response"
    );
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    // Read file as buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Encrypt file
    const { encryptedData, iv } = await encryptFile(fileBuffer);

    // Save encrypted file
    await writeFile(filePath, encryptedData);

    // Save file info to database
    const responseFile = await prisma.documentResponse.create({
      data: {
        name: file.name,
        url: fileName,
        size: file.size,
        documentId,
        encrypted: true,
        iv: iv.toString("hex"),
      },
    });

    const documentUrl = `${process.env.NEXT_PUBLIC_API_URL}/dashboard/documents/${document.id}`;
    // Send notification email to user
    if (document.createdBy?.email) {
      await sendEmailServerAction({
        to: document.createdBy.email,
        subject: `Client Response: ${document.title}`,
        meta: {
          title: `Dear ${document.createdBy.name}`,
          description: `Your client ${client.name} from ${client.companyName} has uploaded a response file for document "${document.title}"., The response file "${file.name}" is now available in your document management system.`,
          link: documentUrl,
          buttonText: "View Document",
          footer: `You can access this file by logging into your account.`,
        },
      });
    }

    return NextResponse.json(
      {
        message: "File uploaded successfully",
        file: responseFile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "An error occurred uploading the file" },
      { status: 500 }
    );
  }
}

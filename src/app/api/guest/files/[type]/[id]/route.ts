import { NextRequest, NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth-guest";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";
import { decryptFile } from "@/lib/file-encryption";

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const client = await verifyGuestSession();

    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, id } = params;
    let fileInfo;
    let filePath;

    // Determine file type and fetch data
    if (type === "document") {
      // First check if file belongs to client's document
      const file = await prisma.documentFile.findUnique({
        where: { id },
        include: {
          document: {
            select: { clientId: true },
          },
        },
      });

      if (!file || file.document.clientId !== client.id) {
        return NextResponse.json(
          { error: "File not found or access denied" },
          { status: 404 }
        );
      }

      fileInfo = file;
      filePath = path.join(process.cwd(), "attachments", "documents", file.url);
    } else if (type === "response") {
      // Check if response file belongs to client's document
      const file = await prisma.documentResponse.findUnique({
        where: { id },
        include: {
          document: {
            select: { clientId: true },
          },
        },
      });

      if (!file || file.document.clientId !== client.id) {
        return NextResponse.json(
          { error: "File not found or access denied" },
          { status: 404 }
        );
      }

      fileInfo = file;
      filePath = path.join(
        process.cwd(),
        "attachments",
        "documents",
        "response",
        file.url
      );
    } else {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Read file
    const encryptedData = await readFile(filePath);

    // Decrypt if needed
    let fileData;
    if (fileInfo.encrypted && fileInfo.iv) {
      fileData = await decryptFile(encryptedData, fileInfo.iv);
    } else {
      fileData = encryptedData;
    }

    // Set correct content type
    const headers = new Headers();
    headers.set(
      "Content-Disposition",
      `attachment; filename="${fileInfo.name}"`
    );
    headers.set("Content-Type", "application/octet-stream");

    return new NextResponse(fileData, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("File download error:", error);
    return NextResponse.json(
      { error: "An error occurred downloading the file" },
      { status: 500 }
    );
  }
}

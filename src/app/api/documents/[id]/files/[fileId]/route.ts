import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptFile } from "@/lib/file-encryption";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import * as fs from "fs";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: { id: string; fileId: string } }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Ambil informasi file
    const file = await prisma.documentFile.findFirst({
      where: {
        id: (await params).fileId,
        documentId: (await params).id,
        document: {
          OR: [
            { createdById: session.user.id },
            { team: { members: { some: { userId: session.user.id } } } },
          ],
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Baca file dari sistem
    const filePath = path.join(process.cwd(), file.url.substring(1)); // Hapus '/' di awal
    const fileData = await fs.promises.readFile(filePath);

    // Dekripsi jika file dienkripsi
    let responseData: Buffer;
    if (file.encrypted && file.iv) {
      responseData = await decryptFile(fileData, file.iv);
    } else {
      responseData = fileData;
    }

    // Tentukan Content-Type berdasarkan ekstensi file
    const ext = path.extname(file.name).toLowerCase();
    let contentType = "application/octet-stream"; // Default

    if (ext === ".pdf") contentType = "application/pdf";

    // Tentukan tipe header berdasarkan query parameter
    const isPreview = request.url.includes("preview=true");
    const disposition = isPreview ? "inline" : "attachment";

    // Kirim file sebagai respons
    return new NextResponse(responseData, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(file.name)}"`,
      },
    });
  } catch (error) {
    console.error("Error accessing file:", error);
    return NextResponse.json(
      { error: "Failed to access file" },
      { status: 500 }
    );
  }
}

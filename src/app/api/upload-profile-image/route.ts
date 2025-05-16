import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: "File and userId are required" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const extension = path.extname(file.name);
    const filename = `${uuidv4()}${extension}`;

    // Path untuk menyimpan file
    const uploadDir = path.join(process.cwd(), "public", "account", "images");
    const filePath = path.join(uploadDir, filename);

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Buat folder jika belum ada
    await fs.mkdir(uploadDir, { recursive: true });

    // Simpan file
    await writeFile(filePath, buffer);

    // Generate URL untuk diakses publik
    const publicUrl = `/account/images/${filename}`;

    return NextResponse.json({
      url: publicUrl,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

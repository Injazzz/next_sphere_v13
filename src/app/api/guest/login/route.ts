import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createGuestSession } from "@/lib/auth-guest";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token } = body;

    if (!email || !token) {
      return NextResponse.json(
        { error: "Email and token are required" },
        { status: 400 }
      );
    }

    // Find client by email and token
    const client = await prisma.client.findFirst({
      where: {
        email: email,
        token: token,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Invalid email or token" },
        { status: 401 }
      );
    }

    // Create session
    await createGuestSession(client.id);

    return NextResponse.json({ message: "Login successful" }, { status: 200 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}

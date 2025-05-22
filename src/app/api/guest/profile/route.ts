import { NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth-guest";

export async function GET() {
  try {
    const client = await verifyGuestSession();

    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Remove sensitive data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { token, sessionToken, ...safeClient } = client;

    return NextResponse.json({ client: safeClient }, { status: 200 });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "An error occurred fetching profile" },
      { status: 500 }
    );
  }
}

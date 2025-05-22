import { NextResponse } from "next/server";
import { destroyGuestSession } from "@/lib/auth-guest";

export async function POST() {
  try {
    await destroyGuestSession();

    return NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "An error occurred during logout" },
      { status: 500 }
    );
  }
}

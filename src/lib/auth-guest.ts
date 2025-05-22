import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

// Create guest session token
export async function createGuestSession(clientId: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  // Generate a random token
  const tokenBytes = randomBytes(32);
  const token = tokenBytes.toString("hex");

  // Encrypt the token
  const hashedToken = createHash("sha256").update(token).digest("hex");

  // Store in database
  await prisma.client.update({
    where: { id: clientId },
    data: {
      sessionToken: hashedToken,
    },
  });

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set({
    name: "guest_session",
    value: token,
    expires: expiresAt,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return token;
}

// Verify guest session token
export async function verifyGuestSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("guest_session")?.value;

  if (!sessionToken) {
    return null;
  }

  // Hash the cookie token for comparison
  const hashedToken = createHash("sha256").update(sessionToken).digest("hex");

  // Look up client by the hashed token
  const client = await prisma.client.findUnique({
    where: { sessionToken: hashedToken },
  });

  return client;
}

// Logout and destroy session
export async function destroyGuestSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("guest_session")?.value;

  if (sessionToken) {
    const hashedToken = createHash("sha256").update(sessionToken).digest("hex");

    // Remove session token from database
    await prisma.client.updateMany({
      where: { sessionToken: hashedToken },
      data: { sessionToken: null },
    });
  }

  // Delete cookie
  cookieStore.delete("guest_session");
}

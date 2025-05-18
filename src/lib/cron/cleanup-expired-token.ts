import { prisma } from "@/lib/prisma";

export async function cleanupExpiredInvitations() {
  const now = new Date();
  await prisma.teamInvitation.deleteMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  });
  console.log(`Cleaned up expired invitations at ${now}`);
}

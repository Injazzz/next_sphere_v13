import { prisma } from "../../prisma";
import { v4 as uuidv4 } from "uuid";

export async function createTeamInvitation(teamId: string, email: string) {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit dari sekarang

  return await prisma.teamInvitation.create({
    data: {
      teamId,
      email,
      token,
      expiresAt,
    },
  });
}

export async function validateInvitation(token: string) {
  const invitation = await prisma.teamInvitation.findUnique({
    where: { token },
    include: { team: true },
  });

  if (!invitation) {
    throw new Error("Invalid invitation token");
  }

  if (new Date() > invitation.expiresAt) {
    await prisma.teamInvitation.delete({ where: { id: invitation.id } });
    throw new Error("Invitation has expired");
  }

  return invitation;
}

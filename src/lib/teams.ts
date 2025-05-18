import { prisma } from "./prisma";

export async function getUserTeam(userId: string) {
  return await prisma.teamMember.findFirst({
    where: {
      userId,
    },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function isTeamLeader(userId: string, teamId: string) {
  const member = await prisma.teamMember.findFirst({
    where: {
      userId,
      teamId,
      role: "LEADER",
    },
  });

  return !!member;
}

import { DocumentFlow, DocumentStatus, DocumentType } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { faker } from "@faker-js/faker/locale/id_ID";

// function generateRandomNumber(length: number): string {
//   const min = 10 ** (length - 1);
//   const max = 10 ** length - 1;
//   return Math.floor(min + Math.random() * (max - min + 1)).toString();
// }

function getRandomDateInterval(days: number[]): { start: Date; end: Date } {
  const startDate = faker.date.recent({ days: 30 });
  const dayInterval = faker.helpers.arrayElement(days);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + dayInterval);

  return { start: startDate, end: endDate };
}

async function main() {
  // Pastikan ada user, client, dan team yang sudah ada
  const [user, client, team] = await Promise.all([
    prisma.user.findFirst(),
    prisma.client.findFirst(),
    prisma.team.findFirst(),
  ]);

  if (!user || !client) {
    throw new Error("User or Client not found in database");
  }

  const documentTypes = ["SPK", "JO", "BA", "IS", "SA", "INVOICE"] as const;
  const documentFlows = ["IN", "OUT"] as const;
  const documentStatuses = [
    "DRAFT",
    "ACTIVE",
    "WARNING",
    "OVERDUE",
    "COMPLETED",
    "APPROVED",
  ] as const;
  const dayIntervals = [0, 1, 5, 10, 15, 20, 30];

  // Buat 50 dokumen dummy
  const documents = Array.from({ length: 50 }, () => {
    const { start, end } = getRandomDateInterval(dayIntervals);
    const documentType = faker.helpers.arrayElement(
      documentTypes
    ) as DocumentType;
    const documentFlow = faker.helpers.arrayElement(
      documentFlows
    ) as DocumentFlow;
    const status = faker.helpers.arrayElement(
      documentStatuses
    ) as DocumentStatus;

    return {
      title: `${documentType} ${faker.company.buzzPhrase()}`,
      type: documentType,
      flow: documentFlow,
      status: status,
      description: faker.lorem.paragraph(),
      startTrackAt: start,
      endTrackAt: end,
      completedAt:
        status === "APPROVED"
          ? faker.date.between({ from: start, to: end })
          : null,
      approvedAt:
        status === "APPROVED"
          ? faker.date.between({
              from: start,
              to: end,
            })
          : null,
      createdById: user.id,
      clientId: client.id,
      teamId: team?.id,
    };
  });

  // Insert dokumen dan file terkait
  for (const docData of documents) {
    const document = await prisma.document.create({
      data: {
        ...docData,
        files: {
          create: Array.from(
            { length: faker.number.int({ min: 1, max: 3 }) },
            () => ({
              name: `file_${faker.system.commonFileName(faker.system.commonFileExt())}`,
              url: faker.internet.url(),
              size: faker.number.int({ min: 1000, max: 1000000 }),
              encrypted: faker.datatype.boolean(),
              iv: faker.datatype.boolean()
                ? faker.string.alphanumeric(16)
                : null,
            })
          ),
        },
        responseFile:
          docData.flow === "IN"
            ? {
                create: Array.from(
                  { length: faker.number.int({ min: 0, max: 2 }) },
                  () => ({
                    name: `response_${faker.system.commonFileName(faker.system.commonFileExt())}`,
                    url: faker.internet.url(),
                    size: faker.number.int({ min: 1000, max: 1000000 }),
                    encrypted: faker.datatype.boolean(),
                    iv: faker.datatype.boolean()
                      ? faker.string.alphanumeric(16)
                      : null,
                  })
                ),
              }
            : undefined,
      },
    });

    console.log(`Created document: ${document.title}`);
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

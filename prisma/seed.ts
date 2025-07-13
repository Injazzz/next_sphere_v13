import { DocumentFlow, DocumentStatus, DocumentType } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { faker } from "@faker-js/faker/locale/id_ID";

interface DateRange {
  start: Date;
  end: Date;
}

function calculateStatus(startDate: Date, endDate: Date): DocumentStatus {
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  if (now < startDate) {
    return "DRAFT";
  }

  if (now > endDate) {
    return "OVERDUE";
  }

  if (endDate <= sevenDaysFromNow) {
    return "WARNING";
  }

  return "ACTIVE";
}

function generateDateRange(
  type: "past" | "warning" | "active" | "future"
): DateRange {
  const now = new Date();

  switch (type) {
    case "past": {
      // For overdue documents (ended 1-30 days ago)
      const start = new Date(now);
      start.setDate(now.getDate() - faker.number.int({ min: 60, max: 90 }));
      const end = new Date(now);
      end.setDate(now.getDate() - faker.number.int({ min: 1, max: 30 }));
      return { start, end };
    }
    case "warning": {
      // For documents ending in next 7 days
      const start = new Date(now);
      start.setDate(now.getDate() - faker.number.int({ min: 15, max: 30 }));
      const end = new Date(now);
      end.setDate(now.getDate() + faker.number.int({ min: 1, max: 7 }));
      return { start, end };
    }
    case "active": {
      // For active documents (ending in 8-30 days)
      const start = new Date(now);
      start.setDate(now.getDate() - faker.number.int({ min: 15, max: 30 }));
      const end = new Date(now);
      end.setDate(now.getDate() + faker.number.int({ min: 8, max: 30 }));
      return { start, end };
    }
    case "future": {
      // For draft documents (starting in future)
      const start = new Date(now);
      start.setDate(now.getDate() + faker.number.int({ min: 1, max: 30 }));
      const end = new Date(start);
      end.setDate(start.getDate() + faker.number.int({ min: 15, max: 30 }));
      return { start, end };
    }
  }
}

async function main() {
  // Make sure we have users, clients, and teams
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

  console.log("🌱 Starting to seed documents...");

  // Distribution of documents:
  // - 10 overdue documents (past)
  // - 10 warning documents (ending soon)
  // - 15 active documents
  // - 5 draft documents (future)
  // - 10 completed/approved documents

  for (let i = 0; i < 50; i++) {
    let dateRangeType: "past" | "warning" | "active" | "future";
    let isComplete = false;

    if (i < 10) {
      dateRangeType = "past"; // First 10 are overdue
    } else if (i < 20) {
      dateRangeType = "warning"; // Next 10 are in warning state
    } else if (i < 35) {
      dateRangeType = "active"; // Next 15 are active
    } else if (i < 40) {
      dateRangeType = "future"; // Next 5 are drafts
    } else {
      // Last 10 are completed/approved
      dateRangeType = "past";
      isComplete = true;
    }

    const { start, end } = generateDateRange(dateRangeType);
    const documentType = faker.helpers.arrayElement(
      documentTypes
    ) as DocumentType;
    const documentFlow = faker.helpers.arrayElement(
      documentFlows
    ) as DocumentFlow;
    let status = calculateStatus(start, end);
    let completedAt = null;
    let approvedAt = null;

    // For completed/approved documents
    if (isComplete) {
      const completionDate = new Date(
        start.getTime() + (end.getTime() - start.getTime()) * 0.8
      );
      status = "COMPLETED";
      completedAt = completionDate;

      // 50% chance of being approved after completion
      if (faker.datatype.boolean()) {
        status = "APPROVED";
        approvedAt = new Date(completionDate);
        approvedAt.setDate(
          completionDate.getDate() + faker.number.int({ min: 1, max: 5 })
        );
      }
    }
    const doc = await prisma.document.create({
      data: {
        title: `${documentType} - ${faker.company.buzzPhrase()}`,
        type: documentType,
        flow: documentFlow,
        status: status,
        description: faker.lorem.paragraph(),
        startTrackAt: start,
        endTrackAt: end,
        completedAt,
        approvedAt,
        createdById: user.id,
        clientId: client.id,
        teamId: team?.id,
        isPinned: faker.datatype.boolean(),
        files: {
          create: Array.from(
            { length: faker.number.int({ min: 1, max: 3 }) },
            () => ({
              name: `${documentType}_${faker.system.commonFileName()}`,
              url: faker.internet.url(),
              size: faker.number.int({ min: 1000, max: 10000000 }), // 1KB to 10MB
              encrypted: faker.datatype.boolean(),
              iv: faker.datatype.boolean()
                ? faker.string.alphanumeric(16)
                : null,
            })
          ),
        },
      },
    });

    // Add response files for completed/approved documents
    if (status === "COMPLETED" || status === "APPROVED") {
      await prisma.documentResponse.createMany({
        data: Array.from(
          { length: faker.number.int({ min: 1, max: 2 }) },
          () => ({
            documentId: doc.id,
            name: `response_${documentType}_${faker.system.commonFileName()}`,
            url: faker.internet.url(),
            size: faker.number.int({ min: 1000, max: 5000000 }), // 1KB to 5MB
            encrypted: faker.datatype.boolean(),
            iv: faker.datatype.boolean() ? faker.string.alphanumeric(16) : null,
          })
        ),
      });
    }

    if ((i + 1) % 10 === 0) {
      console.log(`✅ Created ${i + 1} documents`);
    }
  }

  const totalDocuments = await prisma.document.count();
  console.log(
    `\n🎉 Seeding completed! Created ${totalDocuments} documents in total.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

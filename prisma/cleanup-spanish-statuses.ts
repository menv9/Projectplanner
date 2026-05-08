import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const replacements = [
  { from: "No iniciada", to: "Todo", rank: 1, color: "#6b7280" },
  { from: "En curso", to: "Doing", rank: 2, color: "#3b82f6" },
  { from: "Completada", to: "Done", rank: 3, color: "#10b981" },
  { from: "Bloqueada", to: "Blocked", rank: 4, color: "#c33518" },
  { from: "Pensar mejor", to: "Needs Review", rank: 5, color: "#5b2840" }
];

async function main() {
  let updatedTasks = 0;
  let deletedStatuses = 0;

  for (const replacement of replacements) {
    const target = await prisma.status.upsert({
      where: { name: replacement.to },
      update: { rank: replacement.rank, color: replacement.color },
      create: { name: replacement.to, rank: replacement.rank, color: replacement.color }
    });

    const sources = await prisma.status.findMany({
      where: {
        name: {
          equals: replacement.from,
          mode: "insensitive"
        }
      },
      select: { id: true, name: true }
    });

    const sourceIds = sources.map((status) => status.id).filter((id) => id !== target.id);
    if (!sourceIds.length) continue;

    const updated = await prisma.task.updateMany({
      where: { statusId: { in: sourceIds } },
      data: { statusId: target.id }
    });

    const deleted = await prisma.status.deleteMany({
      where: { id: { in: sourceIds } }
    });

    updatedTasks += updated.count;
    deletedStatuses += deleted.count;
    console.log(`${replacement.from} -> ${replacement.to}: ${updated.count} tasks, ${deleted.count} statuses deleted`);
  }

  console.log(`Total reassigned tasks: ${updatedTasks}`);
  console.log(`Total deleted Spanish statuses: ${deletedStatuses}`);
}

main().finally(() => prisma.$disconnect());

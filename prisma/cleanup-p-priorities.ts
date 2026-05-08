import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const low = await prisma.priority.upsert({
    where: { name: "Low" },
    update: { rank: 1, color: "#6b7280" },
    create: { name: "Low", rank: 1, color: "#6b7280" }
  });

  const pPriorities = await prisma.priority.findMany({
    where: {
      name: {
        startsWith: "P",
        mode: "insensitive"
      }
    },
    select: { id: true, name: true }
  });

  const ids = pPriorities.map((priority) => priority.id).filter((id) => id !== low.id);

  const updated = ids.length
    ? await prisma.task.updateMany({
        where: { priorityId: { in: ids } },
        data: { priorityId: low.id }
      })
    : { count: 0 };

  const deleted = ids.length
    ? await prisma.priority.deleteMany({
        where: { id: { in: ids } }
      })
    : { count: 0 };

  console.log(`Reassigned ${updated.count} tasks to Low.`);
  console.log(`Deleted ${deleted.count} P* priorities: ${pPriorities.map((priority) => priority.name).join(", ") || "none"}`);
}

main().finally(() => prisma.$disconnect());

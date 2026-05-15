import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.status.findUnique({ where: { name: "To Do" }, select: { id: true } });
  const todo = await prisma.status.findUnique({ where: { name: "Todo" }, select: { id: true, name: true } });

  if (!todo) {
    console.log("No 'Todo' status found. Nothing to do.");
    return;
  }

  if (existing) {
    const updated = await prisma.task.updateMany({
      where: { statusId: todo.id },
      data: { statusId: existing.id }
    });
    await prisma.status.delete({ where: { id: todo.id } });
    console.log(`Reassigned ${updated.count} tasks from 'Todo' to 'To Do' and deleted 'Todo' status.`);
  } else {
    await prisma.status.update({
      where: { id: todo.id },
      data: { name: "To Do" }
    });
    console.log("Renamed 'Todo' to 'To Do'.");
  }
}

main().finally(() => prisma.$disconnect());

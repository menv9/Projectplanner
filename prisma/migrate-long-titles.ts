import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tasks = await prisma.task.findMany({
    where: {
      title: {
        // Prisma no tiene length nativo en where para String,
        // así que filtramos aquí con JS para ser precisos.
      }
    },
    select: { id: true, title: true, notes: true }
  });

  const targets = tasks.filter((t) => t.title.length > 70);

  if (targets.length === 0) {
    console.log("No tasks with long titles found.");
    return;
  }

  console.log(`Found ${targets.length} task(s) with title length > 70.`);

  for (const task of targets) {
    const rest = task.title.slice(67).trimStart();
    const newTitle = task.title.slice(0, 67).trimEnd() + "...";
    const newNotes = task.notes ? rest + "\n\n" + task.notes : rest;

    await prisma.task.update({
      where: { id: task.id },
      data: { title: newTitle, notes: newNotes }
    });

    console.log(`Updated task ${task.id}: "${newTitle}"`);
  }

  console.log("Migration complete.");
}

main().finally(() => prisma.$disconnect());

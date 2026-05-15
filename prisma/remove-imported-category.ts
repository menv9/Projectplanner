import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const category = await prisma.category.findUnique({
    where: { name: "Imported" },
    select: { id: true }
  });

  if (!category) {
    console.log("No 'Imported' category found. Nothing to do.");
    return;
  }

  const updated = await prisma.task.updateMany({
    where: { categoryId: category.id },
    data: { categoryId: null }
  });

  await prisma.category.delete({
    where: { id: category.id }
  });

  console.log(`Removed 'Imported' category from ${updated.count} tasks and deleted the category.`);
}

main().finally(() => prisma.$disconnect());

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed script is for fresh databases. On register, each user gets their own defaults.
  // This just ensures the first user has data if the DB was set up manually.
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log("No users found. Defaults are created per-user on registration.");
    return;
  }

  const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!firstUser) return;

  const priorities = [
    { name: "Low", rank: 1, color: "#6b7280" },
    { name: "Medium", rank: 2, color: "#f59e0b" },
    { name: "High", rank: 3, color: "#ef4444" }
  ];
  const statuses = [
    { name: "To Do", rank: 1, color: "#6b7280" },
    { name: "Doing", rank: 2, color: "#3b82f6" },
    { name: "Done", rank: 3, color: "#10b981" }
  ];
  const categories = [
    { name: "Frontend", color: "#7c5cff" },
    { name: "Backend", color: "#22c55e" },
    { name: "Design", color: "#ec4899" },
    { name: "Bug", color: "#ef4444" }
  ];

  for (const p of priorities) {
    await prisma.priority.upsert({
      where: { name_ownerId: { name: p.name, ownerId: firstUser.id } },
      update: {},
      create: { ...p, ownerId: firstUser.id }
    });
  }
  for (const s of statuses) {
    await prisma.status.upsert({
      where: { name_ownerId: { name: s.name, ownerId: firstUser.id } },
      update: {},
      create: { ...s, ownerId: firstUser.id }
    });
  }
  for (const c of categories) {
    await prisma.category.upsert({
      where: { name_ownerId: { name: c.name, ownerId: firstUser.id } },
      update: {},
      create: { ...c, ownerId: firstUser.id }
    });
  }
  await prisma.project.upsert({
    where: { name_ownerId: { name: "Inbox", ownerId: firstUser.id } },
    update: {},
    create: { name: "Inbox", color: "#7c5cff", ownerId: firstUser.id }
  });
  console.log("Seed complete.");
}

main().finally(() => prisma.$disconnect());

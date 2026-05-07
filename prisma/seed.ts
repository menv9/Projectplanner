import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const priorities = [
    { name: "Low", rank: 1, color: "#6b7280" },
    { name: "Medium", rank: 2, color: "#f59e0b" },
    { name: "High", rank: 3, color: "#ef4444" }
  ];
  const statuses = [
    { name: "Todo", rank: 1, color: "#6b7280" },
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
    await prisma.priority.upsert({ where: { name: p.name }, update: {}, create: p });
  }
  for (const s of statuses) {
    await prisma.status.upsert({ where: { name: s.name }, update: {}, create: s });
  }
  for (const c of categories) {
    await prisma.category.upsert({ where: { name: c.name }, update: {}, create: c });
  }
  await prisma.project.upsert({
    where: { name: "Inbox" },
    update: {},
    create: { name: "Inbox", color: "#7c5cff" }
  });
  console.log("Seed complete.");
}

main().finally(() => prisma.$disconnect());

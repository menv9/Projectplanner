import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAuth, json } from "@/lib/api";

export async function GET(_req: NextRequest) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;

  const tasks = await prisma.task.findMany({
    where: { deletedAt: { not: null } },
    include: {
      project: true, author: { select: { id: true, username: true } },
      priority: true, status: true, category: true
    },
    orderBy: [{ deletedAt: "desc" }]
  });
  return json(tasks);
}

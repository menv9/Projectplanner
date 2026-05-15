import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { bad, ensureAuth, json } from "@/lib/api";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;

  const existing = await prisma.task.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!existing) return bad("Not found", 404);

  const t = await prisma.task.update({
    where: { id: params.id },
    data: { deletedAt: null },
    include: {
      project: true, author: { select: { id: true, username: true } },
      priority: true, status: true, category: true
    }
  });
  return json(t);
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { bad, ensureAuth, json } from "@/lib/api";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;

  const existing = await prisma.task.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!existing) return bad("Not found", 404);

  await prisma.task.delete({ where: { id: params.id } });
  return json({ ok: true });
}

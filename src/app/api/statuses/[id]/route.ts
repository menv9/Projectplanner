import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bad, ensureAuth, json } from "@/lib/api";

const Patch = z.object({ name: z.string().min(1).max(60).optional(), rank: z.number().int().optional(), color: z.string().nullable().optional() });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth(); if (auth.error) return auth.error;
  const p = Patch.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return bad("Invalid input");
  return json(await prisma.status.update({ where: { id: params.id }, data: p.data }));
}
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth(); if (auth.error) return auth.error;
  const inUse = await prisma.task.count({ where: { statusId: params.id } });
  if (inUse) return bad("Status is in use", 409);
  await prisma.status.delete({ where: { id: params.id } });
  return json({ ok: true });
}

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bad, ensureAuth, json } from "@/lib/api";

const Patch = z.object({ name: z.string().min(1).max(60).optional(), rank: z.number().int().optional(), color: z.string().nullable().optional() });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth(); if (auth.error) return auth.error;
  const p = Patch.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return bad("Invalid input");
  try {
    return json(await prisma.priority.update({
      where: { id: params.id, ownerId: auth.user.id },
      data: p.data
    }));
  } catch { return bad("Not found or name taken", 404); }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth(); if (auth.error) return auth.error;
  const existing = await prisma.priority.findFirst({ where: { id: params.id, ownerId: auth.user.id } });
  if (!existing) return bad("Not found", 404);
  const inUse = await prisma.task.count({ where: { priorityId: params.id } });
  if (inUse) return bad("Priority is in use", 409);
  await prisma.priority.delete({ where: { id: params.id } });
  return json({ ok: true });
}

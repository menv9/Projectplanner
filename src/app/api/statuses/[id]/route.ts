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
    return json(await prisma.status.update({
      where: { id: params.id, ownerId: auth.user.id },
      data: p.data
    }));
  } catch { return bad("Not found or name taken", 404); }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth(); if (auth.error) return auth.error;
  const existing = await prisma.status.findFirst({ where: { id: params.id, ownerId: auth.user.id } });
  if (!existing) return bad("Not found", 404);

  const reassignTo = new URL(req.url).searchParams.get("reassignTo");
  const inUse = await prisma.task.count({ where: { statusId: params.id } });

  if (inUse && !reassignTo) return bad("Status is in use", 409);

  if (inUse && reassignTo) {
    if (reassignTo === params.id) return bad("Cannot reassign to the same status", 400);
    const target = await prisma.status.findFirst({ where: { id: reassignTo, ownerId: auth.user.id } });
    if (!target) return bad("Target status not found", 404);
    await prisma.$transaction([
      prisma.task.updateMany({ where: { statusId: params.id }, data: { statusId: reassignTo } }),
      prisma.status.delete({ where: { id: params.id } })
    ]);
    return json({ ok: true, reassigned: inUse });
  }

  await prisma.status.delete({ where: { id: params.id } });
  return json({ ok: true });
}

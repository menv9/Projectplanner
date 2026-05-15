import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bad, ensureAuth, json } from "@/lib/api";
import { hashPin, isValidPin } from "@/lib/pin";

const Patch = z.object({ pin: z.string().optional() });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth(); if (auth.error) return auth.error;
  if (auth.user.id !== params.id) return bad("You can only change your own PIN", 403);
  const p = Patch.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return bad("Invalid input");
  const data: { pinHash?: string } = {};
  if (p.data.pin) {
    if (!isValidPin(p.data.pin)) return bad("PIN must be 4-8 digits");
    data.pinHash = await hashPin(p.data.pin);
  }
  return json(await prisma.user.update({ where: { id: params.id }, data, select: { id: true, username: true, createdAt: true } }));
}
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth(); if (auth.error) return auth.error;
  const inUse = await prisma.task.count({ where: { authorId: params.id } });
  if (inUse) return bad("User has tasks; reassign first", 409);
  if (auth.user!.id === params.id) return bad("Cannot delete current user", 400);
  await prisma.user.delete({ where: { id: params.id } });
  return json({ ok: true });
}

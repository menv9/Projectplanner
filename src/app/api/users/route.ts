import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bad, ensureAuth, json } from "@/lib/api";
import { hashPin, isValidPin } from "@/lib/pin";

const Create = z.object({
  username: z.string().min(2).max(40).regex(/^[A-Za-z0-9_.-]+$/),
  pin: z.string()
});

export async function GET() {
  const auth = await ensureAuth(); if (auth.error) return auth.error;
  return json(await prisma.user.findMany({ select: { id: true, username: true, createdAt: true }, orderBy: { username: "asc" } }));
}
export async function POST(req: NextRequest) {
  const auth = await ensureAuth(); if (auth.error) return auth.error;
  const p = Create.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return bad("Invalid input");
  if (!isValidPin(p.data.pin)) return bad("PIN must be 4-8 digits");
  try {
    const u = await prisma.user.create({
      data: { username: p.data.username, pinHash: await hashPin(p.data.pin) },
      select: { id: true, username: true, createdAt: true }
    });
    return json(u, { status: 201 });
  } catch { return bad("Username already exists", 409); }
}

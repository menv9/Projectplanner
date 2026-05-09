import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bad, ensureAuth, json } from "@/lib/api";

const Create = z.object({ name: z.string().min(1).max(60), color: z.string().optional().nullable() });

const DEFAULTS = [
  { name: "Frontend", color: "#7c5cff" },
  { name: "Backend", color: "#22c55e" },
  { name: "Design", color: "#ec4899" },
  { name: "Bug", color: "#ef4444" }
];

export async function GET() {
  const auth = await ensureAuth(); if (auth.error) return auth.error;

  const count = await prisma.category.count({ where: { ownerId: auth.user.id } });
  if (count === 0) {
    for (const d of DEFAULTS) {
      await prisma.category.create({ data: { ...d, ownerId: auth.user.id } }).catch(() => {});
    }
  }

  return json(await prisma.category.findMany({
    where: { ownerId: auth.user.id },
    orderBy: { name: "asc" }
  }));
}

export async function POST(req: NextRequest) {
  const auth = await ensureAuth(); if (auth.error) return auth.error;
  const p = Create.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return bad("Invalid input");
  try {
    return json(await prisma.category.create({
      data: { name: p.data.name, color: p.data.color || null, ownerId: auth.user.id }
    }), { status: 201 });
  } catch { return bad("Name already exists", 409); }
}

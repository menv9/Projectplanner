import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bad, ensureAuth, json } from "@/lib/api";

const Create = z.object({ name: z.string().min(1).max(60), rank: z.number().int().default(0), color: z.string().optional().nullable() });

const DEFAULTS = [
  { name: "To Do", rank: 1, color: "#7a7268" },
  { name: "Doing", rank: 2, color: "#5a7280" },
  { name: "Done", rank: 3, color: "#2f5a3a" }
];

// Old defaults — migrated to the new muted palette in place on next load
const OLD_TO_NEW: Record<string, string> = {
  "#6b7280": "#7a7268",
  "#3b82f6": "#5a7280",
  "#10b981": "#2f5a3a"
};

export async function GET() {
  const auth = await ensureAuth(); if (auth.error) return auth.error;

  const count = await prisma.status.count({ where: { ownerId: auth.user.id } });
  if (count === 0) {
    for (const d of DEFAULTS) {
      await prisma.status.create({ data: { ...d, ownerId: auth.user.id } }).catch(() => {});
    }
  } else {
    for (const [oldColor, newColor] of Object.entries(OLD_TO_NEW)) {
      await prisma.status.updateMany({
        where: { ownerId: auth.user.id, color: oldColor },
        data: { color: newColor }
      }).catch(() => {});
    }
  }

  return json(await prisma.status.findMany({
    where: { ownerId: auth.user.id },
    orderBy: [{ rank: "asc" }, { name: "asc" }]
  }));
}

export async function POST(req: NextRequest) {
  const auth = await ensureAuth(); if (auth.error) return auth.error;
  const p = Create.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return bad("Invalid input");
  try {
    return json(await prisma.status.create({
      data: { name: p.data.name, rank: p.data.rank, color: p.data.color || null, ownerId: auth.user.id }
    }), { status: 201 });
  } catch { return bad("Name already exists", 409); }
}

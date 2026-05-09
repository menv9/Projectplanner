import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bad, ensureAuth, json } from "@/lib/api";

const Create = z.object({ name: z.string().min(1).max(60), color: z.string().optional().nullable() });

export async function GET() {
  const auth = await ensureAuth(); if (auth.error) return auth.error;

  const memberships = await prisma.teamMember.findMany({
    where: { userId: auth.user.id },
    select: { teamId: true }
  });
  const teamIds = memberships.map((m) => m.teamId);

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { teamId: null },
        { teamId: { in: teamIds } }
      ]
    },
    orderBy: { name: "asc" }
  });

  return json(projects);
}

export async function POST(req: NextRequest) {
  const auth = await ensureAuth(); if (auth.error) return auth.error;
  const p = Create.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return bad("Invalid input");
  try {
    return json(await prisma.project.create({ data: { name: p.data.name, color: p.data.color || null } }), { status: 201 });
  } catch { return bad("Name already exists", 409); }
}

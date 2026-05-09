import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bad, ensureAuth, json } from "@/lib/api";

const Create = z.object({ name: z.string().min(1).max(60) });

export async function GET() {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;

  const memberships = await prisma.teamMember.findMany({
    where: { userId: auth.user.id },
    include: {
      team: {
        include: {
          members: {
            include: { user: { select: { id: true, username: true } } }
          },
          projects: { select: { id: true, name: true } }
        }
      }
    }
  });

  return json(memberships.map((m) => ({
    id: m.team.id,
    name: m.team.name,
    role: m.role,
    members: m.team.members.map((tm) => ({
      id: tm.id,
      userId: tm.user.id,
      username: tm.user.username,
      role: tm.role
    })),
    projects: m.team.projects
  })));
}

export async function POST(req: NextRequest) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;

  const parsed = Create.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return bad("Invalid input");

  const team = await prisma.team.create({
    data: {
      name: parsed.data.name,
      members: {
        create: {
          userId: auth.user.id,
          role: "admin"
        }
      }
    }
  });

  return json(team, { status: 201 });
}

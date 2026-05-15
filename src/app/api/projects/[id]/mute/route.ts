import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { bad, ensureAuth, json } from "@/lib/api";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return bad("Project not found", 404);

  await prisma.mutedProject.upsert({
    where: { userId_projectId: { userId: auth.user.id, projectId: params.id } },
    create: { userId: auth.user.id, projectId: params.id },
    update: {}
  });

  return json({ muted: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;

  await prisma.mutedProject.deleteMany({
    where: { userId: auth.user.id, projectId: params.id }
  });

  return json({ muted: false });
}

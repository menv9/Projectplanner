import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bad, ensureAuth, json } from "@/lib/api";

const Patch = z.object({
  title: z.string().min(1).max(200).optional(),
  notes: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  projectId: z.string().optional(),
  authorId: z.string().optional(),
  priorityId: z.string().optional(),
  statusId: z.string().optional(),
  categoryId: z.string().nullable().optional()
});

const include = {
  project: true, priority: true, status: true, category: true,
  author: { select: { id: true, username: true } }
} as const;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;
  const t = await prisma.task.findUnique({ where: { id: params.id }, include });
  if (!t) return bad("Not found", 404);
  return json(t);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;
  const parsed = Patch.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return bad("Invalid input");
  const d = parsed.data;
  const t = await prisma.task.update({
    where: { id: params.id },
    data: {
      ...(d.title !== undefined && { title: d.title }),
      ...(d.notes !== undefined && { notes: d.notes }),
      ...(d.dueDate !== undefined && { dueDate: d.dueDate ? new Date(d.dueDate) : null }),
      ...(d.projectId !== undefined && { projectId: d.projectId }),
      ...(d.authorId !== undefined && { authorId: d.authorId }),
      ...(d.priorityId !== undefined && { priorityId: d.priorityId }),
      ...(d.statusId !== undefined && { statusId: d.statusId }),
      ...(d.categoryId !== undefined && { categoryId: d.categoryId })
    },
    include
  });
  return json(t);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;
  await prisma.task.delete({ where: { id: params.id } });
  return json({ ok: true });
}

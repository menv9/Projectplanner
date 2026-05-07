import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bad, ensureAuth, json } from "@/lib/api";
import type { Prisma } from "@prisma/client";

const Create = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  projectId: z.string().min(1),
  authorId: z.string().min(1),
  priorityId: z.string().min(1),
  statusId: z.string().min(1),
  categoryId: z.string().optional().nullable()
});

export async function GET(req: NextRequest) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;

  const sp = req.nextUrl.searchParams;
  const where: Prisma.TaskWhereInput = {};
  const set = (k: keyof Prisma.TaskWhereInput, v: string | null) => {
    if (v) (where as Record<string, unknown>)[k as string] = v;
  };
  set("projectId", sp.get("projectId"));
  set("priorityId", sp.get("priorityId"));
  set("statusId", sp.get("statusId"));
  set("authorId", sp.get("authorId"));
  set("categoryId", sp.get("categoryId"));
  const from = sp.get("from"), to = sp.get("to");
  if (from || to) {
    where.dueDate = {};
    if (from) (where.dueDate as Prisma.DateTimeFilter).gte = new Date(from);
    if (to) (where.dueDate as Prisma.DateTimeFilter).lte = new Date(to);
  }
  const q = sp.get("q");
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } }
    ];
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: true, author: { select: { id: true, username: true } },
      priority: true, status: true, category: true
    },
    orderBy: [{ updatedAt: "desc" }]
  });
  return json(tasks);
}

export async function POST(req: NextRequest) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;
  const parsed = Create.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return bad("Invalid input");

  const data = parsed.data;
  const task = await prisma.task.create({
    data: {
      title: data.title,
      notes: data.notes || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      projectId: data.projectId,
      authorId: data.authorId,
      priorityId: data.priorityId,
      statusId: data.statusId,
      categoryId: data.categoryId || null
    },
    include: { project: true, priority: true, status: true, category: true, author: { select: { id: true, username: true } } }
  });
  return json(task, { status: 201 });
}

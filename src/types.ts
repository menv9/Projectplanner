export type Id = string;
export type Named = { id: Id; name: string; color?: string | null };
export type Project = Named & { context?: string | null };
export type Priority = Named & { rank: number };
export type Status = Named & { rank: number };
export type Category = Named;
export type User = { id: Id; username: string; createdAt?: string };

export type Task = {
  id: Id;
  title: string;
  notes: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  project: Project;
  author: User;
  priority: Priority;
  status: Status;
  category: Category | null;
};

export type Filters = {
  projectId?: string;
  priorityId?: string;
  statusId?: string;
  authorId?: string;
  categoryId?: string;
  from?: string;
  to?: string;
  q?: string;
};

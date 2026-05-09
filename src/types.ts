export type Id = string;
export type Named = { id: Id; name: string; color?: string | null };
export type Project = Named & { context?: string | null; teamId?: string | null; ownerId?: string | null };
export type Priority = Named & { rank: number };
export type Status = Named & { rank: number };
export type Category = Named;
export type User = { id: Id; username: string; createdAt?: string };

export type TeamMember = {
  id: Id;
  userId: Id;
  username: string;
  role: "admin" | "member";
};

export type Team = {
  id: Id;
  name: string;
  role?: "admin" | "member";
  members: TeamMember[];
  projects: { id: Id; name: string }[];
};

export type Task = {
  id: Id;
  title: string;
  notes: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
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

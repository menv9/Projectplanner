import type { Task } from "@/types";

const now = new Date().toISOString();
const yesterday = new Date(Date.now() - 86400000).toISOString();
const tomorrow = new Date(Date.now() + 86400000).toISOString();

const mockProject = {
  id: "project-mock-1",
  name: "Mock Project",
  color: "#7c5cff",
  context: null
};

const mockAuthor = {
  id: "user-mock-1",
  username: "devuser",
  createdAt: now
};

const priorities = {
  low: { id: "prio-low", name: "Low", rank: 1, color: "#6b7280" },
  medium: { id: "prio-medium", name: "Medium", rank: 2, color: "#f59e0b" },
  high: { id: "prio-high", name: "High", rank: 3, color: "#ef4444" }
};

const statuses = {
  todo: { id: "status-todo", name: "To Do", rank: 1, color: "#6b7280" },
  doing: { id: "status-doing", name: "Doing", rank: 2, color: "#3b82f6" },
  done: { id: "status-done", name: "Done", rank: 3, color: "#10b981" }
};

const categories = {
  frontend: { id: "cat-fe", name: "Frontend", color: "#7c5cff" },
  backend: { id: "cat-be", name: "Backend", color: "#22c55e" },
  design: { id: "cat-design", name: "Design", color: "#ec4899" },
  bug: { id: "cat-bug", name: "Bug", color: "#ef4444" }
};

export const mockTasks: Task[] = [
  {
    id: "task-1",
    title: "Design new landing page",
    notes: "Create mockups in Figma and review with the team before implementation.",
    dueDate: tomorrow,
    createdAt: yesterday,
    updatedAt: yesterday,
    deletedAt: null,
    archivedAt: null,
    location: null,
    project: mockProject,
    author: mockAuthor,
    priority: priorities.high,
    status: statuses.todo,
    category: categories.design
  },
  {
    id: "task-2",
    title: "Set up CI/CD pipeline",
    notes: "Configure GitHub Actions for automated testing and deployment to staging.",
    dueDate: tomorrow,
    createdAt: yesterday,
    updatedAt: now,
    deletedAt: null,
    archivedAt: null,
    location: null,
    project: mockProject,
    author: mockAuthor,
    priority: priorities.high,
    status: statuses.todo,
    category: categories.backend
  },
  {
    id: "task-3",
    title: "Refactor authentication module",
    notes: "Migrate from session-based auth to JWT tokens and update middleware.",
    dueDate: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    archivedAt: null,
    location: null,
    project: mockProject,
    author: mockAuthor,
    priority: priorities.medium,
    status: statuses.todo,
    category: categories.backend
  },
  {
    id: "task-4",
    title: "Build kanban board component",
    notes: "Implement drag-and-drop with react-beautiful-dnd and status columns.",
    dueDate: now,
    createdAt: yesterday,
    updatedAt: now,
    deletedAt: null,
    archivedAt: null,
    location: null,
    project: mockProject,
    author: mockAuthor,
    priority: priorities.high,
    status: statuses.doing,
    category: categories.frontend
  },
  {
    id: "task-5",
    title: "Write API documentation",
    notes: "Document all REST endpoints with request/response examples in OpenAPI format.",
    dueDate: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    archivedAt: null,
    location: null,
    project: mockProject,
    author: mockAuthor,
    priority: priorities.low,
    status: statuses.doing,
    category: categories.backend
  },
  {
    id: "task-6",
    title: "Fix navigation bug on mobile",
    notes: "Menu does not close when tapping outside on iOS Safari. Investigate z-index issues.",
    dueDate: yesterday,
    createdAt: yesterday,
    updatedAt: now,
    deletedAt: null,
    archivedAt: null,
    location: null,
    project: mockProject,
    author: mockAuthor,
    priority: priorities.medium,
    status: statuses.doing,
    category: categories.bug
  },
  {
    id: "task-7",
    title: "Set up project database schema",
    notes: "Create Prisma models for tasks, projects, users, and relations.",
    dueDate: yesterday,
    createdAt: yesterday,
    updatedAt: yesterday,
    deletedAt: null,
    archivedAt: null,
    location: null,
    project: mockProject,
    author: mockAuthor,
    priority: priorities.high,
    status: statuses.done,
    category: categories.backend
  },
  {
    id: "task-8",
    title: "Implement dark mode toggle",
    notes: "Add theme switching with localStorage persistence and system preference detection.",
    dueDate: yesterday,
    createdAt: yesterday,
    updatedAt: yesterday,
    deletedAt: null,
    archivedAt: null,
    location: null,
    project: mockProject,
    author: mockAuthor,
    priority: priorities.low,
    status: statuses.done,
    category: categories.frontend
  },
  {
    id: "task-9",
    title: "Create unit tests for utilities",
    notes: "Achieve 80% coverage on date helpers, formatters, and validators.",
    dueDate: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    archivedAt: null,
    location: null,
    project: mockProject,
    author: mockAuthor,
    priority: priorities.medium,
    status: statuses.done,
    category: categories.frontend
  }
];

export const mockStatuses = Object.values(statuses);
export const mockPriorities = Object.values(priorities);
export const mockCategories = Object.values(categories);
export const mockProjects = [mockProject];
export const mockUsers = [mockAuthor];

"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Grid3X3, List, Columns3, Filter, Settings as SettingsIcon, LogOut, Trash2, RotateCcw, XCircle, Plus, X, Archive, ArchiveRestore, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import type { Category, Filters, Priority, Project, Status, Task, User } from "@/types";
import { FilterBar } from "@/components/FilterBar";
import { TaskCard, TaskRow } from "@/components/TaskCard";
import { NewTaskPanel } from "@/components/NewTaskPanel";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { KanbanBoard } from "@/components/KanbanBoard";
import { TaskFilterView } from "@/components/TaskFilterView";

const fetchJson = async <T,>(url: string): Promise<T> => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <Home />
    </Suspense>
  );
}

function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [filters, setFilters] = useState<Filters>({});
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Task | null>(null);
  const [taskView, setTaskView] = useState<"cards" | "lines" | "kanban" | "filter">("lines");
  const [viewingTrash, setViewingTrash] = useState(false);
  const [viewingArchive, setViewingArchive] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [attentionCollapsed, setAttentionCollapsed] = useState(false);
  const [doneCollapsed, setDoneCollapsed] = useState(true);
  const [composeCollapsed, setComposeCollapsed] = useState(false);
  const [addingProject, setAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [projectBusy, setProjectBusy] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("hiddenProjects") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    const saved = localStorage.getItem("composeCollapsed");
    if (saved === "true") setComposeCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("composeCollapsed", String(composeCollapsed));
  }, [composeCollapsed]);

  useEffect(() => {
    const onStorage = () => {
      try { setHiddenIds(JSON.parse(localStorage.getItem("hiddenProjects") || "[]")); } catch { setHiddenIds([]); }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchJson<User>("/api/auth/me") });
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => fetchJson<Project[]>("/api/projects") });
  const priorities = useQuery({ queryKey: ["priorities"], queryFn: () => fetchJson<Priority[]>("/api/priorities") });
  const statuses = useQuery({ queryKey: ["statuses"], queryFn: () => fetchJson<Status[]>("/api/statuses") });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => fetchJson<Category[]>("/api/categories") });
  const users = useQuery({ queryKey: ["users"], queryFn: () => fetchJson<User[]>("/api/users") });
  const trashTasks = useQuery({
    queryKey: ["trash"],
    queryFn: () => fetchJson<Task[]>("/api/trash")
  });
  const archivedTasks = useQuery({
    queryKey: ["tasks", "archived", activeProjectId],
    enabled: !!activeProjectId,
    queryFn: () => fetchJson<Task[]>(`/api/tasks?archived=true&projectId=${activeProjectId}`)
  });

  useEffect(() => {
    if (activeProjectId && projects.data && !projects.data.find((p) => p.id === activeProjectId)) {
      setActiveProjectId(null);
    }
  }, [projects.data, activeProjectId]);

  useEffect(() => {
    if (me.data?.username?.toLowerCase() === "eris") {
      document.documentElement.dataset.theme = "eris";
      localStorage.setItem("erisTheme", "true");
      document.documentElement.classList.remove("dark");
    } else if (me.data) {
      document.documentElement.dataset.theme = "";
      localStorage.removeItem("erisTheme");
      const saved = localStorage.getItem("theme");
      if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.documentElement.classList.add("dark");
      }
    }
  }, [me.data]);

  // Handle deep-linking from notifications
  useEffect(() => {
    const urlProjectId = searchParams.get("projectId");
    const urlTaskId = searchParams.get("taskId");
    if (!urlProjectId && !urlTaskId) return;

    setViewingTrash(false);
    setViewingArchive(false);

    if (urlProjectId) setActiveProjectId(urlProjectId);

    if (urlTaskId) {
      fetchJson<Task>(`/api/tasks/${urlTaskId}`)
        .then((task) => setSelected(task))
        .catch(() => {});
    }

    window.history.replaceState({}, "", window.location.pathname);
  }, [searchParams]);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v === undefined || v === null || v === false || v === "") return;
      sp.set(k, String(v));
    });
    if (activeProjectId) sp.set("projectId", activeProjectId);
    return sp.toString();
  }, [filters, activeProjectId]);

  const tasks = useQuery({
    queryKey: ["tasks", queryString],
    enabled: !!activeProjectId,
    queryFn: () => fetchJson<Task[]>(`/api/tasks?${queryString}`)
  });

  const opts = {
    projects: projects.data || [],
    priorities: priorities.data || [],
    statuses: statuses.data || [],
    categories: categories.data || [],
    users: users.data || []
  };
  const ready = !!(me.data && opts.projects.length && opts.priorities.length && opts.statuses.length);
  const activeProject = opts.projects.find((p) => p.id === activeProjectId) || null;

  const visibleProjects = showHidden ? opts.projects : opts.projects.filter((p) => !hiddenIds.includes(p.id));
  const hiddenProjects = opts.projects.filter((p) => hiddenIds.includes(p.id));

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("erisTheme");
    document.documentElement.dataset.theme = "";
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    }
    router.push("/login");
    router.refresh();
  };

  const patchTaskCache = useCallback((taskId: string, patch: Partial<Task>) => {
    qc.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) => {
      if (!old) return old;
      return old.map((t) => (t.id === taskId ? { ...t, ...patch } : t));
    });
  }, [qc]);

  const handleTaskMove = useCallback(async (taskId: string, newStatusId: string) => {
    const r = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ statusId: newStatusId })
    });
    if (!r.ok) throw new Error("Failed to move task");
    qc.invalidateQueries({ queryKey: ["tasks"] });
  }, [qc]);

  const handleTaskAttention = useCallback(async (taskId: string, attention: boolean, newStatusId?: string) => {
    const body: { attention: boolean; statusId?: string } = { attention };
    if (newStatusId) body.statusId = newStatusId;
    const r = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error("Failed to update attention");
    qc.invalidateQueries({ queryKey: ["tasks"] });
  }, [qc]);

  const handleArchive = useCallback(async (taskId: string, archive: boolean) => {
    const r = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ archived: archive })
    });
    if (!r.ok) return;
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["tasks", "archived"] });
  }, [qc]);

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    setProjectBusy(true); setProjectError(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newProjectName.trim() })
    });
    setProjectBusy(false);
    if (!res.ok) { setProjectError((await res.json()).error || "Failed"); return; }
    const p: Project = await res.json();
    setNewProjectName(""); setAddingProject(false);
    qc.invalidateQueries({ queryKey: ["projects"] });
    setActiveProjectId(p.id);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-rule bg-paper/60 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between gap-4">
          <div className="min-w-0 flex flex-col gap-0.5">
            <span className="eyebrow text-ash">Atelier · Project Planner</span>
            <h1 className="font-display text-[1.7rem] sm:text-[2.1rem] font-light leading-[1.05] tracking-tight text-ink truncate">
              <span className="display-italic">{activeProject?.name || "Projects"}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {activeProjectId && (
              <button className="btn" onClick={() => setActiveProjectId(null)} title="Back to projects">
                <ArrowLeft size={14} /> <span className="hidden sm:inline text-xs">Projects</span>
              </button>
            )}
            <button className={viewingArchive ? "btn-primary" : "btn"} onClick={() => { setViewingArchive(!viewingArchive); setViewingTrash(false); }} title="Archive">
              <Archive size={14} />
              <span className="hidden sm:inline text-xs">{archivedTasks.data?.length ?? 0}</span>
            </button>
            <button className={viewingTrash ? "btn-primary" : "btn"} onClick={() => { setViewingTrash(!viewingTrash); setViewingArchive(false); }} title="Trash">
              <Trash2 size={14} />
              <span className="hidden sm:inline text-xs">{trashTasks.data?.length ?? 0}</span>
            </button>
            <NotificationBell />
            <Link href="/settings" className="btn" title="Settings">
              <SettingsIcon size={14} />
            </Link>
            <ThemeToggle />
            <button className="btn-ghost" onClick={logout} title="Log out"><LogOut size={14} /></button>
          </div>
        </div>

      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 lg:gap-10">
        {me.data && (
          <div
            className="hidden lg:block relative transition-[width] duration-300 ease-out overflow-hidden"
            style={{ width: composeCollapsed ? 40 : 380 }}
          >
            {/* Panel — always 380px wide so it doesn't reflow; gets clipped by parent */}
            <div
              className="transition-opacity duration-300 ease-out"
              style={{
                width: 380,
                opacity: composeCollapsed ? 0 : 1,
                pointerEvents: composeCollapsed ? "none" : "auto"
              }}
              aria-hidden={composeCollapsed}
            >
              <NewTaskPanel
                opts={opts}
                currentUserId={me.data.id}
                ready={ready}
                lockedProjectId={activeProjectId}
                onCreated={() => qc.invalidateQueries({ queryKey: ["tasks"] })}
              />
            </div>

            {/* Collapse button (fades out as we collapse) */}
            <button
              type="button"
              onClick={() => setComposeCollapsed(true)}
              className="absolute right-1 top-3 z-10 btn-ghost !p-1 bg-paper border border-rule rounded-full shadow-sm transition-opacity duration-200"
              style={{
                opacity: composeCollapsed ? 0 : 1,
                pointerEvents: composeCollapsed ? "none" : "auto"
              }}
              title="Collapse compose panel"
              aria-label="Collapse compose panel"
            >
              <ChevronLeft size={14} />
            </button>

            {/* Rail (fades in when collapsed) — full height of the column */}
            <button
              type="button"
              onClick={() => setComposeCollapsed(false)}
              className="paper-card !absolute top-0 left-0 w-10 py-3 flex flex-col items-center gap-2 hover:shadow-[0_4px_14px_-6px_rgba(0,0,0,0.18)] transition-opacity duration-300 ease-out"
              style={{
                opacity: composeCollapsed ? 1 : 0,
                pointerEvents: composeCollapsed ? "auto" : "none"
              }}
              title="Expand compose panel"
              aria-label="Expand compose panel"
            >
              <ChevronRight size={14} />
              <span className="eyebrow [writing-mode:vertical-rl] rotate-180 tracking-widest">Compose</span>
            </button>
          </div>
        )}

        <section className="space-y-6 min-w-0">
          {viewingTrash ? (
            <div>
              <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
                <div>
                  <div className="eyebrow mb-1">Trash</div>
                  <h2 className="font-display text-[1.8rem] sm:text-[2.6rem] leading-[0.95] tracking-tightish">
                    {trashTasks.data?.length ?? 0} items
                  </h2>
                </div>
                <button type="button" className="btn-ghost" onClick={() => setViewingTrash(false)}>
                  <RotateCcw size={14} /> <span className="hidden sm:inline">Back</span>
                </button>
              </div>

              {trashTasks.isLoading && <div className="text-ash eyebrow">Loading…</div>}

              {trashTasks.data && trashTasks.data.length === 0 && (
                <div className="empty-state p-8 sm:p-12 text-center">
                  <span className="eyebrow">Empty trash</span>
                  <p className="font-display text-[1.2rem] sm:text-[1.4rem] mt-2 italic text-ash">No deleted tasks.</p>
                </div>
              )}

              {trashTasks.data && trashTasks.data.length > 0 && (
                <div className="space-y-2">
                  {trashTasks.data.map((t) => {
                    const restore = async () => {
                      await fetch(`/api/trash/${t.id}/restore`, { method: "POST" });
                      qc.invalidateQueries({ queryKey: ["trash"] });
                      qc.invalidateQueries({ queryKey: ["tasks"] });
                    };
                    const destroy = async () => {
                      if (!confirm("Delete this task permanently?")) return;
                      await fetch(`/api/trash/${t.id}`, { method: "DELETE" });
                      qc.invalidateQueries({ queryKey: ["trash"] });
                      qc.invalidateQueries({ queryKey: ["tasks"] });
                    };
                    return (
                      <div key={t.id} className="paper-card text-left px-3 py-2.5 pl-5 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="chip text-[9px]">{t.project.name}</span>
                              {t.category && <span className="chip text-[9px]">{t.category.name}</span>}
                            </div>
                            <h3 className="font-display text-[1.05rem] leading-snug tracking-tightish text-ink truncate">
                              {t.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="numeral text-[10px] text-ash">{format(new Date(t.deletedAt!), "MMM dd HH:mm")}</span>
                            <button type="button" className="btn-ghost !text-forest" onClick={restore}>Restore</button>
                            <button type="button" className="btn-ghost !text-vermilion" onClick={destroy}><XCircle size={14} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : viewingArchive ? (
            <div>
              <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
                <div>
                  <div className="eyebrow mb-1">Archive</div>
                  <h2 className="font-display text-[1.8rem] sm:text-[2.6rem] leading-[0.95] tracking-tightish">
                    {archivedTasks.data?.length ?? 0} items
                  </h2>
                </div>
                <button type="button" className="btn-ghost" onClick={() => setViewingArchive(false)}>
                  <RotateCcw size={14} /> <span className="hidden sm:inline">Back</span>
                </button>
              </div>

              {archivedTasks.isLoading && <div className="text-ash eyebrow">Loading…</div>}

              {archivedTasks.data && archivedTasks.data.length === 0 && (
                <div className="empty-state p-8 sm:p-12 text-center">
                  <span className="eyebrow">Empty archive</span>
                  <p className="font-display text-[1.2rem] sm:text-[1.4rem] mt-2 italic text-ash">No archived tasks.</p>
                </div>
              )}

              {archivedTasks.data && archivedTasks.data.length > 0 && (
                <div className="space-y-2">
                  {archivedTasks.data.map((t) => (
                    <div key={t.id} className="rise-in relative hover:z-10">
                      <TaskRow
                        task={t}
                        statuses={opts.statuses}
                        onClick={() => setSelected(t)}
                        onUpdated={() => qc.invalidateQueries({ queryKey: ["tasks"] })}
                        onArchive={handleArchive}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {activeProject ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 flex-shrink-0 sm:ml-auto">
                    <button
                      className="btn-accent lg:hidden"
                      onClick={() => setShowAddModal(true)}
                    >
                      <Plus size={14} /> <span className="sm:hidden">Add</span><span className="hidden sm:inline">Add task</span>
                    </button>
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="text-right">
                        <div className="numeral text-[1.4rem] sm:text-[1.8rem] lg:text-[2.6rem] leading-none text-vermilion">
                          {String(tasks.data?.length ?? 0).padStart(2, "0")}
                        </div>
                        <div className="eyebrow hidden sm:block">tasks on file</div>
                      </div>
                      <div className="view-toggle" aria-label="Task view">
                      <button
                        type="button"
                        className="view-toggle-btn"
                        data-active={taskView === "cards"}
                        onClick={() => setTaskView("cards")}
                        title="Card view"
                        aria-label="Card view"
                      >
                        <Grid3X3 size={15} />
                      </button>
                      <button
                        type="button"
                        className="view-toggle-btn"
                        data-active={taskView === "lines"}
                        onClick={() => setTaskView("lines")}
                        title="Line view"
                        aria-label="Line view"
                      >
                        <List size={16} />
                      </button>
                      <button
                        type="button"
                        className="view-toggle-btn"
                        data-active={taskView === "kanban"}
                        onClick={() => setTaskView("kanban")}
                        title="Kanban view"
                        aria-label="Kanban view"
                      >
                        <Columns3 size={15} />
                      </button>
                      <button
                        type="button"
                        className="view-toggle-btn"
                        data-active={taskView === "filter"}
                        onClick={() => setTaskView("filter")}
                        title="Filter view"
                        aria-label="Filter view"
                      >
                        <Filter size={15} />
                      </button>
                    </div>
                  </div>
                  </div>
                </div>
              ) : opts.projects.length === 0 ? (
                <div className="paper-card p-8 sm:p-12 text-center">
                  <div className="relative z-[1]">
                    <span className="eyebrow">Empty workshop</span>
                    <h2 className="font-display text-[1.4rem] sm:text-[1.8rem] mt-2">
                      <span className="display-italic">Begin</span> by creating a project.
                    </h2>
                    <p className="text-sm text-ash mt-2">Click <em>+ New project</em> below to add the first one.</p>
                  </div>
                </div>
              ) : null}

              {!activeProject && opts.projects.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                      <div className="eyebrow mb-1">Dashboard</div>
                      <h2 className="font-display text-[1.8rem] sm:text-[2.6rem] leading-[0.95] tracking-tightish">
                        {visibleProjects.length} project{visibleProjects.length !== 1 ? "s" : ""}
                        {hiddenProjects.length > 0 && (
                          <span className="text-ash text-[1rem] sm:text-[1.2rem] ml-2 font-light">
                            ({hiddenProjects.length} hidden)
                          </span>
                        )}
                      </h2>
                    </div>
                    {hiddenProjects.length > 0 && (
                      <button
                        className="btn-ghost text-xs"
                        onClick={() => setShowHidden((v) => !v)}
                      >
                        {showHidden ? "Hide hidden" : "Show hidden"}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visibleProjects.map((p, i) => (
                      <button
                        key={p.id}
                        onClick={() => setActiveProjectId(p.id)}
                        className={`paper-card text-left p-5 sm:p-6 w-full transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(var(--shadow-rgb),0.15)] ${hiddenIds.includes(p.id) ? "opacity-60" : ""}`}
                        style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
                      >
                        <div className="relative z-[1]">
                          <div className="flex items-center gap-2 mb-3">
                            {p.color && <span className="dot w-2.5 h-2.5" style={{ background: p.color }} />}
                            <span className="numeral text-[10px] text-dust">{String(i + 1).padStart(2, "0")}</span>
                          </div>
                          <h3 className="font-display text-[1.25rem] sm:text-[1.4rem] leading-snug tracking-tightish text-ink">
                            <span className="display-italic">{p.name}</span>
                          </h3>
                          {p.context && (
                            <p className="text-sm text-ash mt-1.5 line-clamp-2">{p.context}</p>
                          )}
                        </div>
                      </button>
                    ))}

                    {addingProject ? (
                      <div className="paper-card p-5 sm:p-6">
                        <div className="relative z-[1] space-y-3">
                          <div className="eyebrow">New project</div>
                          <input
                            autoFocus
                            className="input !py-1.5 !px-2.5 text-sm"
                            placeholder="Project name"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") createProject();
                              if (e.key === "Escape") { setAddingProject(false); setNewProjectName(""); setProjectError(null); }
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <button className="btn-primary !py-1.5 !px-3 text-xs" onClick={createProject} disabled={projectBusy}>Create</button>
                            <button className="btn-ghost" onClick={() => { setAddingProject(false); setNewProjectName(""); setProjectError(null); }}>
                              <X size={14} />
                            </button>
                          </div>
                          {projectError && <span className="text-xs text-vermilion">{projectError}</span>}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingProject(true)}
                        className="paper-card p-5 sm:p-6 w-full text-center transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(var(--shadow-rgb),0.15)] border-dashed"
                        style={{ borderStyle: "dashed" }}
                      >
                        <div className="relative z-[1]">
                          <Plus size={20} className="mx-auto text-dust mb-2" />
                          <span className="eyebrow">New project</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeProject && taskView !== "kanban" && taskView !== "filter" && (
                <FilterBar filters={filters} setFilters={setFilters} opts={opts} />
              )}

              {tasks.isLoading && (
                <div className="text-ash eyebrow">Loading…</div>
              )}

              {activeProject && tasks.data && tasks.data.length === 0 && (
                <div className="empty-state p-8 sm:p-12 text-center">
                  <span className="eyebrow">A blank page</span>
                  <p className="font-display text-[1.2rem] sm:text-[1.4rem] mt-2 italic text-ash">No entries yet.</p>
                </div>
              )}

              <div key={taskView} className="view-swap">
              {tasks.data && tasks.data.length > 0 && taskView === "cards" && (() => {
                const attentionTasks = tasks.data.filter((t) => t.attention);
                const nonAttention = tasks.data.filter((t) => !t.attention);
                const regularTasks = nonAttention.filter((t) => t.status.name.toLowerCase() !== "done");
                const doneTasks = nonAttention.filter((t) => t.status.name.toLowerCase() === "done");
                return (
                  <div className="space-y-6">
                    {attentionTasks.length > 0 && (
                      <AttentionSection
                        count={attentionTasks.length}
                        collapsed={attentionCollapsed}
                        onToggle={() => setAttentionCollapsed((v) => !v)}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {attentionTasks.map((t) => (
                            <div key={t.id} className="relative hover:z-10">
                              <TaskCard task={t} statuses={opts.statuses} onClick={() => setSelected(t)} onUpdated={() => qc.invalidateQueries({ queryKey: ["tasks"] })} onOptimisticPatch={patchTaskCache} />
                            </div>
                          ))}
                        </div>
                      </AttentionSection>
                    )}
                    {regularTasks.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {regularTasks.map((t, i) => (
                          <div key={t.id} className="rise-in relative hover:z-10" style={{ animationDelay: `${Math.min(i * 35, 280)}ms` }}>
                            <TaskCard task={t} statuses={opts.statuses} onClick={() => setSelected(t)} onUpdated={() => qc.invalidateQueries({ queryKey: ["tasks"] })} onOptimisticPatch={patchTaskCache} />
                          </div>
                        ))}
                      </div>
                    )}
                    {doneTasks.length > 0 && (
                      <DoneSection
                        count={doneTasks.length}
                        collapsed={doneCollapsed}
                        onToggle={() => setDoneCollapsed((v) => !v)}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {doneTasks.map((t) => (
                            <div key={t.id} className="relative hover:z-10">
                              <TaskCard task={t} statuses={opts.statuses} onClick={() => setSelected(t)} onUpdated={() => qc.invalidateQueries({ queryKey: ["tasks"] })} onOptimisticPatch={patchTaskCache} />
                            </div>
                          ))}
                        </div>
                      </DoneSection>
                    )}
                  </div>
                );
              })()}

              {tasks.data && tasks.data.length > 0 && taskView === "lines" && (() => {
                const attentionTasks = tasks.data.filter((t) => t.attention);
                const nonAttention = tasks.data.filter((t) => !t.attention);
                const regularTasks = nonAttention.filter((t) => t.status.name.toLowerCase() !== "done");
                const doneTasks = nonAttention.filter((t) => t.status.name.toLowerCase() === "done");
                return (
                  <div className="space-y-6">
                    {attentionTasks.length > 0 && (
                      <AttentionSection
                        count={attentionTasks.length}
                        collapsed={attentionCollapsed}
                        onToggle={() => setAttentionCollapsed((v) => !v)}
                      >
                        <div className="space-y-2">
                          {attentionTasks.map((t) => (
                            <div key={t.id} className="relative hover:z-10">
                              <TaskRow task={t} statuses={opts.statuses} onClick={() => setSelected(t)} onUpdated={() => qc.invalidateQueries({ queryKey: ["tasks"] })} onOptimisticPatch={patchTaskCache} />
                            </div>
                          ))}
                        </div>
                      </AttentionSection>
                    )}
                    {regularTasks.length > 0 && (
                      <div className="space-y-2">
                        {regularTasks.map((t, i) => (
                          <div key={t.id} className="rise-in relative hover:z-10" style={{ animationDelay: `${Math.min(i * 20, 180)}ms` }}>
                            <TaskRow task={t} statuses={opts.statuses} onClick={() => setSelected(t)} onUpdated={() => qc.invalidateQueries({ queryKey: ["tasks"] })} onOptimisticPatch={patchTaskCache} />
                          </div>
                        ))}
                      </div>
                    )}
                    {doneTasks.length > 0 && (
                      <DoneSection
                        count={doneTasks.length}
                        collapsed={doneCollapsed}
                        onToggle={() => setDoneCollapsed((v) => !v)}
                      >
                        <div className="space-y-2">
                          {doneTasks.map((t) => (
                            <div key={t.id} className="relative hover:z-10">
                              <TaskRow task={t} statuses={opts.statuses} onClick={() => setSelected(t)} onUpdated={() => qc.invalidateQueries({ queryKey: ["tasks"] })} onOptimisticPatch={patchTaskCache} />
                            </div>
                          ))}
                        </div>
                      </DoneSection>
                    )}
                  </div>
                );
              })()}

              {tasks.data && taskView === "kanban" && (
                <KanbanBoard
                  tasks={tasks.data}
                  statuses={opts.statuses}
                  onTaskMove={handleTaskMove}
                  onTaskAttention={handleTaskAttention}
                  onTaskClick={(t) => setSelected(t)}
                  onUpdated={() => qc.invalidateQueries({ queryKey: ["tasks"] })}
                  onOptimisticPatch={patchTaskCache}
                  attentionCollapsed={attentionCollapsed}
                  onToggleAttention={() => setAttentionCollapsed((v) => !v)}
                  doneCollapsed={doneCollapsed}
                  onToggleDone={() => setDoneCollapsed((v) => !v)}
                />
              )}

              {tasks.data && taskView === "filter" && (
                <TaskFilterView
                  tasks={tasks.data}
                  opts={opts}
                  onTaskClick={(t) => setSelected(t)}
                  onUpdated={() => qc.invalidateQueries({ queryKey: ["tasks"] })}
                />
              )}
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-6 mt-6 border-t border-rule">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 text-xs">
          <div className="eyebrow">Atelier — A workshop for the things you intend to do</div>
          <div className="font-display italic text-ash">— Quietly stored on paper, kept in code.</div>
        </div>
      </footer>

      {showAddModal && me.data && (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-6 lg:hidden">
          <button
            type="button"
            aria-label="Close add task"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={() => setShowAddModal(false)}
          />
          <section
            className="paper-card relative z-[1] w-full sm:max-w-xl max-h-[85vh] sm:max-h-[92vh] flex flex-col shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)]"
          >
            <div className="relative z-[1] flex items-center justify-between gap-4 border-b border-rule px-5 py-4">
              <div className="min-w-0">
                <div className="eyebrow mb-1">New entry</div>
                <h2 className="font-display text-[1.5rem] leading-[1.1] tracking-tightish">
                  <span className="display-italic text-vermilion">Compose</span> a task
                </h2>
              </div>
              <button type="button" className="btn-ghost shrink-0" onClick={() => setShowAddModal(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="relative z-[1] flex-1 overflow-y-auto">
              <NewTaskPanel
                opts={opts}
                currentUserId={me.data.id}
                ready={ready}
                lockedProjectId={activeProjectId}
                plain
                onCreated={() => {
                  qc.invalidateQueries({ queryKey: ["tasks"] });
                  setShowAddModal(false);
                }}
              />
            </div>
          </section>
        </div>
      )}

      {/* Modals */}
      <TaskDetailModal
        task={selected}
        opts={opts}
        onOpenChange={(v) => !v && setSelected(null)}
        onDeleted={() => {
          qc.invalidateQueries({ queryKey: ["tasks"] });
          qc.invalidateQueries({ queryKey: ["trash"] });
        }}
        onSaved={(task) => {
          setSelected(task);
          qc.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) => {
            if (!old) return old;
            return old.map((t) => (t.id === task.id ? task : t));
          });
          qc.invalidateQueries({ queryKey: ["tasks"] });
        }}
        onArchive={(task) => {
          setSelected(null);
          qc.invalidateQueries({ queryKey: ["tasks"] });
          qc.invalidateQueries({ queryKey: ["tasks", "archived"] });
        }}
      />
    </div>
  );
}

function AttentionSection({
  count,
  collapsed,
  onToggle,
  children
}: {
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-vermilion/40 bg-vermilion/[0.04]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left"
      >
        <span className="flex items-center gap-2">
          <AlertCircle size={14} className="text-vermilion" />
          <span className="eyebrow !text-vermilion">Attention</span>
          <span className="numeral text-[11px] text-vermilion">{String(count).padStart(2, "0")}</span>
        </span>
        {collapsed ? <ChevronDown size={14} className="text-vermilion" /> : <ChevronUp size={14} className="text-vermilion" />}
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: collapsed ? "0fr" : "1fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function DoneSection({
  count,
  collapsed,
  onToggle,
  children
}: {
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-forest/30 bg-forest/[0.04]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-forest flex-shrink-0" />
          <span className="eyebrow !text-forest">Done</span>
          <span className="numeral text-[11px] text-forest">{String(count).padStart(2, "0")}</span>
        </span>
        {collapsed ? <ChevronDown size={14} className="text-forest" /> : <ChevronUp size={14} className="text-forest" />}
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: collapsed ? "0fr" : "1fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

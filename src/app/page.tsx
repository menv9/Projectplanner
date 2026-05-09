"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Grid3X3, List, Columns3, Filter, Settings as SettingsIcon, LogOut, Trash2, RotateCcw, XCircle, Plus, X } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Category, Filters, Priority, Project, Status, Task, User } from "@/types";
import { FilterBar } from "@/components/FilterBar";
import { TaskCard, TaskRow } from "@/components/TaskCard";
import { NewTaskPanel } from "@/components/NewTaskPanel";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { ProjectTabs } from "@/components/ProjectTabs";
import { KanbanBoard } from "@/components/KanbanBoard";
import { TaskFilterView } from "@/components/TaskFilterView";

const fetchJson = async <T,>(url: string): Promise<T> => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

export default function Home() {
  const router = useRouter();
  const qc = useQueryClient();
  const [filters, setFilters] = useState<Filters>({});
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Task | null>(null);
  const [taskView, setTaskView] = useState<"cards" | "lines" | "kanban" | "filter">("lines");
  const [viewingTrash, setViewingTrash] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

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

  useEffect(() => {
    if (!activeProjectId && projects.data && projects.data.length > 0) {
      setActiveProjectId(projects.data[0].id);
    }
    if (activeProjectId && projects.data && !projects.data.find((p) => p.id === activeProjectId)) {
      setActiveProjectId(projects.data[0]?.id || null);
    }
  }, [projects.data, activeProjectId]);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && sp.set(k, v));
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

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const handleTaskMove = useCallback(async (taskId: string, newStatusId: string) => {
    const r = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ statusId: newStatusId })
    });
    if (!r.ok) throw new Error("Failed to move task");
    qc.invalidateQueries({ queryKey: ["tasks"] });
  }, [qc]);

  const today = new Date();

  return (
    <div className="min-h-screen">
      <header className="border-b border-rule bg-paper/60 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-8 py-5 flex items-end justify-between gap-6">
          <div>
            <div className="eyebrow mb-1">Volume 01 — {today.getFullYear()}</div>
            <h1 className="font-display text-[2.4rem] leading-[0.95] tracking-tightish">
              <span className="display-italic text-vermilion">Atelier</span>
              <span className="text-ink">.</span>
              <span className="font-display text-ink"> Project Planner</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {me.data && (
              <div className="text-right hidden sm:block">
                <div className="eyebrow">Signed in</div>
                <div className="font-display italic text-[1.05rem] leading-tight">{me.data.username}</div>
              </div>
            )}
            <button className={viewingTrash ? "btn-primary" : "btn"} onClick={() => setViewingTrash(!viewingTrash)}>
              <Trash2 size={14} /> {trashTasks.data?.length ?? 0}
            </button>
            <Link href="/settings" className="btn"><SettingsIcon size={14} /> Settings</Link>
            <ThemeToggle />
            <button className="btn-ghost" onClick={logout}><LogOut size={14} /></button>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-8">
          <ProjectTabs
            projects={opts.projects}
            activeId={activeProjectId}
            onSelect={setActiveProjectId}
          />
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-10">
        {me.data && (
          <div className="hidden lg:block">
            <NewTaskPanel
              opts={opts}
              currentUserId={me.data.id}
              ready={ready}
              lockedProjectId={activeProjectId}
              onCreated={() => qc.invalidateQueries({ queryKey: ["tasks"] })}
            />
          </div>
        )}

        <section className="space-y-6 min-w-0">
          {viewingTrash ? (
            <div>
              <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
                <div>
                  <div className="eyebrow mb-1">Trash</div>
                  <h2 className="font-display text-[2.6rem] leading-[0.95] tracking-tightish">
                    {trashTasks.data?.length ?? 0} items
                  </h2>
                </div>
                <button type="button" className="btn-ghost" onClick={() => setViewingTrash(false)}>
                  <RotateCcw size={14} /> Back
                </button>
              </div>

              {trashTasks.isLoading && <div className="text-ash eyebrow">Loading…</div>}

              {trashTasks.data && trashTasks.data.length === 0 && (
                <div className="paper-card p-12 text-center">
                  <div className="relative z-[1]">
                    <span className="eyebrow">Empty trash</span>
                    <p className="font-display text-[1.4rem] mt-2 italic text-ash">No deleted tasks.</p>
                  </div>
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
                      <div key={t.id} className="paper-card text-left px-3 py-2.5 pl-5 w-full" style={{ borderRadius: 0 }}>
                        <div className="flex items-center justify-between gap-3 flex-wrap">
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
          ) : (
            <>
              {activeProject ? (
                <div className="flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <div className="eyebrow mb-1">Now reading</div>
                    <h2 className="font-display text-[2.6rem] leading-[0.95] tracking-tightish">
                      {activeProject.name}
                    </h2>
                  </div>
                  <div className="flex items-end gap-4">
                    <button
                      className="btn-accent lg:hidden"
                      onClick={() => setShowAddModal(true)}
                    >
                      <Plus size={14} /> Add task
                    </button>
                    <div className="text-right">
                      <div className="numeral text-[2.6rem] leading-none text-vermilion">
                        {String(tasks.data?.length ?? 0).padStart(2, "0")}
                      </div>
                      <div className="eyebrow">tasks on file</div>
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
              ) : (
                <div className="paper-card p-12 text-center">
                  <div className="relative z-[1]">
                    <span className="eyebrow">Empty workshop</span>
                    <h2 className="font-display text-[1.8rem] mt-2">
                      <span className="display-italic">Begin</span> by creating a project.
                    </h2>
                    <p className="text-sm text-ash mt-2">Use the <em>+ New</em> tab above to add the first one.</p>
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
                <div className="paper-card p-12 text-center">
                  <div className="relative z-[1]">
                    <span className="eyebrow">A blank page</span>
                    <p className="font-display text-[1.4rem] mt-2 italic text-ash">No entries yet.</p>
                  </div>
                </div>
              )}

              {tasks.data && tasks.data.length > 0 && taskView === "cards" && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {tasks.data.map((t, i) => (
                    <div key={t.id} className="rise-in relative hover:z-10" style={{ animationDelay: `${Math.min(i * 35, 280)}ms` }}>
                      <TaskCard task={t} statuses={opts.statuses} onClick={() => setSelected(t)} onUpdated={() => qc.invalidateQueries({ queryKey: ["tasks"] })} />
                    </div>
                  ))}
                </div>
              )}

              {tasks.data && tasks.data.length > 0 && taskView === "lines" && (
                <div className="space-y-2">
                  {tasks.data.map((t, i) => (
                    <div key={t.id} className="rise-in relative hover:z-10" style={{ animationDelay: `${Math.min(i * 20, 180)}ms` }}>
                      <TaskRow task={t} statuses={opts.statuses} onClick={() => setSelected(t)} onUpdated={() => qc.invalidateQueries({ queryKey: ["tasks"] })} />
                    </div>
                  ))}
                </div>
              )}

              {tasks.data && taskView === "kanban" && (
                <KanbanBoard
                  tasks={tasks.data}
                  statuses={opts.statuses}
                  onTaskMove={handleTaskMove}
                  onTaskClick={(t) => setSelected(t)}
                  onUpdated={() => qc.invalidateQueries({ queryKey: ["tasks"] })}
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
            </>
          )}
        </section>
      </main>

      <footer className="max-w-[1400px] mx-auto px-8 pb-10 pt-6 mt-6 border-t border-rule">
        <div className="flex items-end justify-between text-xs">
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
            className="paper-card relative z-[1] w-full sm:max-w-xl max-h-[85vh] sm:max-h-[92vh] flex flex-col shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5)]"
            style={{ borderRadius: 0 }}
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
                onCreated={() => {
                  qc.invalidateQueries({ queryKey: ["tasks"] });
                  setShowAddModal(false);
                }}
              />
            </div>
          </section>
        </div>
      )}

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
          qc.invalidateQueries({ queryKey: ["tasks"] });
        }}
      />
    </div>
  );
}

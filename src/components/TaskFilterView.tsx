"use client";

import { useMemo, useState } from "react";
import type { Category, Priority, Status, Task, User } from "@/types";
import { TaskCard, TaskRow } from "@/components/TaskCard";
import { Search, X, Grid3X3, List } from "lucide-react";

type Opts = {
  priorities: Priority[];
  statuses: Status[];
  categories: Category[];
  users: User[];
};

export function TaskFilterView({
  tasks,
  opts,
  onTaskClick,
  onUpdated
}: {
  tasks: Task[];
  opts: Opts;
  onTaskClick?: (task: Task) => void;
  onUpdated?: () => void;
}) {
  const [q, setQ] = useState("");
  const [priorityId, setPriorityId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [layout, setLayout] = useState<"cards" | "lines">("cards");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return tasks.filter((t) => {
      if (query && !t.title.toLowerCase().includes(query) && !(t.notes && t.notes.toLowerCase().includes(query))) {
        return false;
      }
      if (priorityId && t.priority.id !== priorityId) return false;
      if (categoryId && (!t.category || t.category.id !== categoryId)) return false;
      if (authorId && t.author.id !== authorId) return false;
      if (from && t.dueDate && new Date(t.dueDate) < new Date(from)) return false;
      if (to && t.dueDate && new Date(t.dueDate) > new Date(to)) return false;
      return true;
    });
  }, [tasks, q, priorityId, categoryId, authorId, from, to]);

  const activeFilters = [
    q,
    priorityId,
    categoryId,
    authorId,
    from,
    to
  ].filter(Boolean).length;

  const clear = () => {
    setQ("");
    setPriorityId("");
    setCategoryId("");
    setAuthorId("");
    setFrom("");
    setTo("");
  };

  return (
    <div className="space-y-6">
      <div className="bg-cream/60 border border-rule rounded-md p-5 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <span className="text-[11px] text-ash tracking-wide">Advanced Filter</span>
          {activeFilters > 0 && (
            <button onClick={clear} className="btn-ghost">
              <X size={12} /> Clear {activeFilters}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="relative block">
              <Search size={14} className="absolute right-3 inset-y-0 my-auto text-dust pointer-events-none" />
              <input
                className="input pl-3 pr-9 py-2 w-full"
                placeholder="Search titles or notes…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
          </div>
          <Select label="Priority" value={priorityId} onChange={setPriorityId} options={opts.priorities} />
          <Select label="Category" value={categoryId} onChange={setCategoryId} options={opts.categories} />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Author"
            value={authorId}
            onChange={setAuthorId}
            options={opts.users.map((u) => ({ id: u.id, name: u.username }))}
          />
          <DateField label="From" value={from} onChange={setFrom} />
          <DateField label="To" value={to} onChange={setTo} />
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <span className="text-[11px] text-ash tracking-wide block mb-1">Results</span>
          <h2 className="font-display text-[2rem] leading-[0.95] tracking-tightish">
            {filtered.length} tasks match
          </h2>
        </div>
        <div className="view-toggle" aria-label="Result layout">
          <button
            type="button"
            className="view-toggle-btn"
            data-active={layout === "cards"}
            onClick={() => setLayout("cards")}
            title="Card view"
          >
            <Grid3X3 size={15} />
          </button>
          <button
            type="button"
            className="view-toggle-btn"
            data-active={layout === "lines"}
            onClick={() => setLayout("lines")}
            title="Line view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state p-12 text-center">
          <span className="text-[11px] text-ash tracking-wide">No matches</span>
          <p className="font-display text-[1.4rem] mt-2 italic text-ash">Adjust your filters to find tasks.</p>
        </div>
      )}

      {filtered.length > 0 && layout === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t, i) => (
            <div key={t.id} className="rise-in relative hover:z-10" style={{ animationDelay: `${Math.min(i * 35, 280)}ms` }}>
              <TaskCard task={t} statuses={opts.statuses} onClick={() => onTaskClick?.(t)} onUpdated={onUpdated} />
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 && layout === "lines" && (
        <div className="space-y-2">
          {filtered.map((t, i) => (
            <div key={t.id} className="rise-in relative hover:z-10" style={{ animationDelay: `${Math.min(i * 20, 180)}ms` }}>
              <TaskRow task={t} statuses={opts.statuses} onClick={() => onTaskClick?.(t)} onUpdated={onUpdated} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  options: { id: string; name: string }[];
}) {
  return (
    <label className="block min-w-[140px] flex-1">
      <span className="text-[11px] text-ash block mb-1">{label}</span>
      <select className="input" value={value || ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </label>
  );
}

function DateField({
  label,
  value,
  onChange
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  const v = value ? value.slice(0, 10) : "";
  return (
    <label className="block min-w-[140px] flex-1">
      <span className="text-[11px] text-ash block mb-1">{label}</span>
      <input
        type="date"
        className="input"
        value={v}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : "")}
      />
    </label>
  );
}

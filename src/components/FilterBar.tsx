"use client";
import type { Category, Filters, Priority, Status, User } from "@/types";
import { AlertCircle, Search, X } from "lucide-react";

type Opts = {
  priorities: Priority[]; statuses: Status[]; categories: Category[]; users: User[];
};

export function FilterBar({
  filters, setFilters, opts
}: { filters: Filters; setFilters: (f: Filters) => void; opts: Opts }) {
  const set = (k: Exclude<keyof Filters, "attention" | "orderBy">, v: string) => {
    const next: Filters = { ...filters };
    if (!v) delete next[k]; else next[k] = v;
    setFilters(next);
  };
  const setOrderBy = (v: string) => {
    const next: Filters = { ...filters };
    if (!v) delete next.orderBy; else next.orderBy = v as Filters["orderBy"];
    setFilters(next);
  };
  const visible: Filters = { ...filters };
  delete visible.projectId;
  const active = Object.values(visible).filter(Boolean).length;
  const clear = () => setFilters({ ...(filters.projectId ? { projectId: filters.projectId } : {}) });

  return (
    <div className="bg-cream/60 border border-rule rounded-md p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-ash tracking-wide">Filter</span>
        {active > 0 && (
          <button onClick={clear} className="btn-ghost"><X size={12} /> Clear {active}</button>
        )}
      </div>
      <StatusPills value={filters.statusId} onChange={(v) => set("statusId", v)} options={opts.statuses} />
      <div className="mb-4">
        <button
          type="button"
          onClick={() => {
            const next = { ...filters };
            if (filters.attention) delete next.attention;
            else next.attention = true;
            setFilters(next);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs transition"
          style={filters.attention
            ? { background: "rgb(var(--vermilion-rgb))", borderColor: "rgb(var(--vermilion-rgb))", color: "#fff" }
            : { borderColor: "rgb(var(--vermilion-rgb))", color: "rgb(var(--vermilion-rgb))" }}
        >
          <AlertCircle size={11} />
          Attention only
        </button>
      </div>
      <div className="flex flex-wrap items-end gap-2 mb-2">
        <div className="min-w-[140px] flex-1">
          <label className="relative block">
            <Search size={14} className="absolute right-3 inset-y-0 my-auto text-dust pointer-events-none" />
            <input
              className="input pr-9"
              placeholder="Search titles or notes…"
              value={filters.q || ""}
              onChange={(e) => set("q", e.target.value)}
            />
          </label>
        </div>
        <Select label="Priority" value={filters.priorityId} onChange={(v) => set("priorityId", v)} options={opts.priorities} />
        <Select label="Category" value={filters.categoryId} onChange={(v) => set("categoryId", v)} options={opts.categories} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        <Select label="Author" value={filters.authorId} onChange={(v) => set("authorId", v)}
                options={opts.users.map((u) => ({ id: u.id, name: u.username }))} />
        <DateField label="From" value={filters.from} onChange={(v) => set("from", v)} />
        <DateField label="To" value={filters.to} onChange={(v) => set("to", v)} />
      </div>
      <div className="mt-2">
        <label className="block">
          <span className="text-[11px] text-ash block mb-1">Order by</span>
          <select className="input" value={filters.orderBy || ""} onChange={(e) => setOrderBy(e.target.value)}>
            <option value="">Recently updated</option>
            <option value="updated_asc">Least recently updated</option>
            <option value="created_desc">Newest first</option>
            <option value="created_asc">Oldest first</option>
            <option value="due_asc">Due date (soonest)</option>
            <option value="due_desc">Due date (latest)</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
            <option value="title_asc">Title (A–Z)</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function Select({
  label, value, onChange, options
}: { label: string; value?: string; onChange: (v: string) => void; options: { id: string; name: string }[] }) {
  return (
    <label className="block">
      <span className="text-[11px] text-ash block mb-1">{label}</span>
      <select className="input" value={value || ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </label>
  );
}

function StatusPills({
  value, onChange, options
}: {
  value?: string;
  onChange: (v: string) => void;
  options: Status[];
}) {
  return (
    <div className="mb-4">
      <span className="eyebrow block mb-2">Status</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              className="status-pill"
              data-active={active}
              style={!active && option.color ? { color: option.color, borderColor: option.color } : {}}
              onClick={() => onChange(active ? "" : option.id)}
            >
              {option.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  const v = value ? value.slice(0, 10) : "";
  return (
    <label className="block">
      <span className="text-[11px] text-ash block mb-1">{label}</span>
      <input type="date" className="input" value={v}
             onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : "")} />
    </label>
  );
}

"use client";
import type { Category, Filters, Priority, Status, User } from "@/types";
import { Search, X } from "lucide-react";

type Opts = {
  priorities: Priority[]; statuses: Status[]; categories: Category[]; users: User[];
};

export function FilterBar({
  filters, setFilters, opts
}: { filters: Filters; setFilters: (f: Filters) => void; opts: Opts }) {
  const set = (k: keyof Filters, v: string) => {
    const next = { ...filters };
    if (!v) delete next[k]; else next[k] = v;
    setFilters(next);
  };
  const visible: Filters = { ...filters };
  delete visible.projectId;
  const active = Object.values(visible).filter(Boolean).length;
  const clear = () => setFilters({ ...(filters.projectId ? { projectId: filters.projectId } : {}) });

  return (
    <div className="paper-card p-4 relative">
      <div className="relative z-[1]">
        <div className="flex items-center justify-between mb-3">
          <span className="eyebrow">Filter — Refine the view</span>
          {active > 0 && (
            <button onClick={clear} className="btn-ghost"><X size={12} /> Clear {active}</button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <label className="relative col-span-full md:col-span-2 lg:col-span-2">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-dust" />
            <input
              className="input pr-9"
              placeholder="Search title or notes…"
              value={filters.q || ""}
              onChange={(e) => set("q", e.target.value)}
            />
          </label>
          <Select label="Priority" value={filters.priorityId} onChange={(v) => set("priorityId", v)} options={opts.priorities} />
          <Select label="Status" value={filters.statusId} onChange={(v) => set("statusId", v)} options={opts.statuses} />
          <Select label="Category" value={filters.categoryId} onChange={(v) => set("categoryId", v)} options={opts.categories} />
          <Select label="Author" value={filters.authorId} onChange={(v) => set("authorId", v)}
                  options={opts.users.map((u) => ({ id: u.id, name: u.username }))} />
          <DateField label="From" value={filters.from} onChange={(v) => set("from", v)} />
          <DateField label="To" value={filters.to} onChange={(v) => set("to", v)} />
        </div>
      </div>
    </div>
  );
}

function Select({
  label, value, onChange, options
}: { label: string; value?: string; onChange: (v: string) => void; options: { id: string; name: string }[] }) {
  return (
    <label className="block">
      <span className="eyebrow block mb-1">{label}</span>
      <select className="input" value={value || ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </label>
  );
}

function DateField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  const v = value ? value.slice(0, 10) : "";
  return (
    <label className="block">
      <span className="eyebrow block mb-1">{label}</span>
      <input type="date" className="input" value={v}
             onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : "")} />
    </label>
  );
}

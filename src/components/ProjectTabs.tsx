"use client";
import type { Project } from "@/types";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function ProjectTabs({
  projects, activeId, onSelect
}: { projects: Project[]; activeId: string | null; onSelect: (id: string) => void }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true); setError(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim() })
    });
    setBusy(false);
    if (!res.ok) { setError((await res.json()).error || "Failed"); return; }
    const p: Project = await res.json();
    setName(""); setAdding(false);
    qc.invalidateQueries({ queryKey: ["projects"] });
    onSelect(p.id);
  };

  return (
    <nav className="flex flex-wrap items-end gap-x-7 gap-y-1 border-b border-rule">
      {projects.map((p, i) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            data-active={active}
            onClick={() => onSelect(p.id)}
            className="tab inline-flex items-center gap-2"
          >
            <span className="numeral text-dust">{String(i + 1).padStart(2, "0")}</span>
            {p.color && <span className="dot" style={{ background: p.color }} />}
            <span>{p.name}</span>
          </button>
        );
      })}

      {adding ? (
        <div className="flex items-center gap-1 pb-2 pt-1">
          <input
            autoFocus
            className="input !py-1 !px-2 max-w-[160px] text-sm"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") create();
              if (e.key === "Escape") { setAdding(false); setName(""); setError(null); }
            }}
          />
          <button className="btn-primary !py-1 !px-2 text-xs" onClick={create} disabled={busy}>Add</button>
          <button className="btn-ghost" onClick={() => { setAdding(false); setName(""); setError(null); }}>
            <X size={12} />
          </button>
          {error && <span className="text-xs text-vermilion ml-1">{error}</span>}
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="tab inline-flex items-center gap-1.5 !text-vermilion hover:!text-ink"
          title="New project"
        >
          <Plus size={12} strokeWidth={2.5} /> New
        </button>
      )}
    </nav>
  );
}

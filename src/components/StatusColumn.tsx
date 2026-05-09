"use client";

import { memo, useState, useMemo } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import type { Status, Task } from "@/types";
import { TaskCard } from "@/components/TaskCard";
import { Search } from "lucide-react";

function StatusColumnInner({
  status,
  tasks,
  statuses,
  onTaskClick,
  onUpdated
}: {
  status: Status;
  tasks: Task[];
  statuses: Status[];
  onTaskClick?: (task: Task) => void;
  onUpdated?: () => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
    );
  }, [tasks, query]);

  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: status.color || "#9a9081" }}
          />
          <span className="eyebrow truncate">{status.name}</span>
          <span className="numeral text-[11px] text-ash">{tasks.length}</span>
        </div>
      </div>

      <div className="mb-3">
        <label className="relative block">
          <Search size={13} className="absolute right-3 inset-y-0 my-auto text-dust pointer-events-none" />
          <input
            className="input pl-3 pr-8 py-2 text-sm w-full"
            placeholder="Filter tasks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <Droppable droppableId={status.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-1 min-h-[120px] space-y-3 transition-colors rounded-none p-2 -mx-2"
            style={{
              background: snapshot.isDraggingOver
                ? "rgba(var(--soft-rgb), 0.35)"
                : "transparent"
            }}
          >
            {filtered.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    style={{
                      ...dragProvided.draggableProps.style,
                      opacity: dragSnapshot.isDragging ? 0.9 : 1
                    }}
                  >
                    <TaskCard
                      task={task}
                      statuses={statuses}
                      onClick={() => onTaskClick?.(task)}
                      onUpdated={onUpdated}
                      interactive={false}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export const StatusColumn = memo(StatusColumnInner, (prev, next) => {
  if (prev.status.id !== next.status.id) return false;
  if (prev.tasks.length !== next.tasks.length) return false;
  return prev.tasks.every((t, i) => t.id === next.tasks[i].id);
});

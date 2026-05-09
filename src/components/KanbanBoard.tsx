"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import type { Status, Task } from "@/types";
import { StatusColumn } from "./StatusColumn";

const normalizeName = (s: string) => s.toLowerCase().replace(/\s+/g, "");

function KanbanBoardInner({
  tasks,
  statuses,
  onTaskMove,
  onTaskClick,
  onUpdated
}: {
  tasks: Task[];
  statuses: Status[];
  onTaskMove?: (taskId: string, newStatusId: string) => void | Promise<void>;
  onTaskClick?: (task: Task) => void;
  onUpdated?: () => void;
}) {
  const [items, setItems] = useState(tasks);

  // Build a lookup from normalized status name -> current user's Status object.
  // This handles the migration case where existing tasks reference old status
  // IDs (owned by the first user) but the current user has new statuses.
  const statusByName = useMemo(() => {
    const map = new Map<string, Status>();
    for (const s of statuses) {
      map.set(normalizeName(s.name), s);
    }
    return map;
  }, [statuses]);

  // Sync from server when the parent query returns fresh data.
  useEffect(() => {
    setItems((prev) => {
      if (prev === tasks) return prev;
      if (prev.length !== tasks.length) return tasks;
      const sameOrder = prev.every((t, i) => t.id === tasks[i].id);
      return sameOrder ? prev : tasks;
    });
  }, [tasks]);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const sourceId = result.source.droppableId;
      const destId = result.destination.droppableId;
      if (sourceId === destId) return;

      const taskId = result.draggableId;
      const newStatus = statuses.find((s) => s.id === destId);
      if (!newStatus) return;

      const previousItems = items;

      flushSync(() => {
        setItems((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: newStatus } : t
          )
        );
      });

      const promise = onTaskMove?.(taskId, destId);
      if (promise) {
        promise.catch(() => {
          setItems(previousItems);
        });
      }
    },
    [onTaskMove, statuses, items]
  );

  const columnStatuses = useMemo(
    () => [...statuses].sort((a, b) => a.rank - b.rank),
    [statuses]
  );

  // Group tasks by matching status NAME instead of status ID.
  // This fixes the migration issue where tasks reference old status IDs.
  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const s of statuses) {
      map.set(s.id, []);
    }
    for (const t of items) {
      // Try to match by the task's status name to the current user's statuses
      const currentStatus = statusByName.get(normalizeName(t.status.name));
      if (currentStatus) {
        const list = map.get(currentStatus.id);
        if (list) list.push(t);
      }
    }
    return map;
  }, [items, statuses, statusByName]);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {columnStatuses.map((status) => (
          <div
            key={status.id}
            className="paper-card p-4 relative flex flex-col h-full"
            style={{ minHeight: 320 }}
          >
            <div className="relative z-[1] flex flex-col h-full">
              <StatusColumn
                status={status}
                tasks={grouped.get(status.id) || []}
                statuses={statuses}
                onTaskClick={onTaskClick}
                onUpdated={onUpdated}
              />
            </div>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

export const KanbanBoard = memo(KanbanBoardInner);

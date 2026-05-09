"use client";

import { memo, useCallback, useMemo } from "react";
import { flushSync } from "react-dom";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import type { Status, Task } from "@/types";
import { StatusColumn } from "./StatusColumn";

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
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const sourceId = result.source.droppableId;
      const destId = result.destination.droppableId;
      if (sourceId === destId) return;

      const taskId = result.draggableId;
      // Force synchronous React flush so the DOM updates before the drag library
      // finishes its drop animation. Prevents React 18 batching flicker.
      flushSync(() => {
        onTaskMove?.(taskId, destId);
      });
    },
    [onTaskMove]
  );

  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "");
  const columnStatuses = useMemo(
    () =>
      [
        statuses.find((s) => normalize(s.name) === "todo") || statuses[0],
        statuses.find((s) => normalize(s.name) === "doing") || statuses[1],
        statuses.find((s) => normalize(s.name) === "done") || statuses[2]
      ].filter(Boolean),
    [statuses]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const s of statuses) {
      map.set(s.id, []);
    }
    for (const t of tasks) {
      const list = map.get(t.status.id);
      if (list) list.push(t);
    }
    return map;
  }, [tasks, statuses]);

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

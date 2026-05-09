"use client";

import { useCallback } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import type { Status, Task } from "@/types";
import { StatusColumn } from "./StatusColumn";

export function KanbanBoard({
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
    async (result: DropResult) => {
      if (!result.destination) return;
      const sourceId = result.source.droppableId;
      const destId = result.destination.droppableId;
      if (sourceId === destId) return;

      const taskId = result.draggableId;
      await onTaskMove?.(taskId, destId);
    },
    [onTaskMove]
  );

  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "");
  const columnStatuses = [
    statuses.find((s) => normalize(s.name) === "todo") || statuses[0],
    statuses.find((s) => normalize(s.name) === "doing") || statuses[1],
    statuses.find((s) => normalize(s.name) === "done") || statuses[2]
  ].filter(Boolean);

  const tasksByStatus = (statusId: string) =>
    tasks.filter((t) => t.status.id === statusId);

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
                tasks={tasksByStatus(status.id)}
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

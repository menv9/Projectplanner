"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { Status, Task } from "@/types";
import { StatusColumn } from "./StatusColumn";

const normalizeName = (s: string) => s.toLowerCase().replace(/\s+/g, "");
const ATTENTION_COLUMN_ID = "__attention";

function KanbanBoardInner({
  tasks,
  statuses,
  onTaskMove,
  onTaskAttention,
  onTaskClick,
  onUpdated,
  onOptimisticPatch,
  attentionCollapsed = false,
  onToggleAttention
}: {
  tasks: Task[];
  statuses: Status[];
  onTaskMove?: (taskId: string, newStatusId: string) => void | Promise<void>;
  onTaskAttention?: (taskId: string, attention: boolean, newStatusId?: string) => void | Promise<void>;
  onTaskClick?: (task: Task) => void;
  onUpdated?: () => void;
  onOptimisticPatch?: (taskId: string, patch: Partial<Task>) => void;
  attentionCollapsed?: boolean;
  onToggleAttention?: () => void;
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
      const same = prev.every((t, i) => t === tasks[i]);
      return same ? prev : tasks;
    });
  }, [tasks]);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const sourceId = result.source.droppableId;
      const destId = result.destination.droppableId;
      if (sourceId === destId) return;

      const taskId = result.draggableId;
      const previousItems = items;

      // Dropping INTO the Attention column → flag the task, keep status.
      if (destId === ATTENTION_COLUMN_ID) {
        flushSync(() => {
          setItems((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, attention: true } : t))
          );
        });
        const p = onTaskAttention?.(taskId, true);
        if (p) p.catch(() => setItems(previousItems));
        return;
      }

      // Dropping OUT of Attention → unflag and (also) move to destination status.
      const newStatus = statuses.find((s) => s.id === destId);
      if (!newStatus) return;

      if (sourceId === ATTENTION_COLUMN_ID) {
        flushSync(() => {
          setItems((prev) =>
            prev.map((t) =>
              t.id === taskId ? { ...t, attention: false, status: newStatus } : t
            )
          );
        });
        const p = onTaskAttention?.(taskId, false, destId);
        if (p) p.catch(() => setItems(previousItems));
        return;
      }

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
    [onTaskMove, onTaskAttention, statuses, items]
  );

  const columnStatuses = useMemo(
    () => [...statuses].sort((a, b) => a.rank - b.rank),
    [statuses]
  );

  // Group tasks by matching status NAME instead of status ID.
  // Attention-flagged tasks are routed to a synthetic column and excluded from status columns.
  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const s of statuses) {
      map.set(s.id, []);
    }
    const attention: Task[] = [];
    for (const t of items) {
      if (t.attention) {
        attention.push(t);
        continue;
      }
      const currentStatus = statusByName.get(normalizeName(t.status.name));
      if (currentStatus) {
        const list = map.get(currentStatus.id);
        if (list) list.push(t);
      }
    }
    return { byStatus: map, attention };
  }, [items, statuses, statusByName]);

  const attentionStatus: Status = useMemo(
    () => ({ id: ATTENTION_COLUMN_ID, name: "Attention", rank: -1, color: "rgb(var(--vermilion-rgb))" }),
    []
  );

  const hasAttention = grouped.attention.length > 0;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {hasAttention && (
          <div className="border border-vermilion/40 bg-vermilion/[0.04] rounded-md relative flex flex-col">
            <button
              type="button"
              onClick={onToggleAttention}
              className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left"
            >
              <span className="flex items-center gap-2">
                <AlertCircle size={14} className="text-vermilion" />
                <span className="eyebrow !text-vermilion">Attention</span>
                <span className="numeral text-[11px] text-vermilion">
                  {String(grouped.attention.length).padStart(2, "0")}
                </span>
              </span>
              {attentionCollapsed ? (
                <ChevronDown size={14} className="text-vermilion" />
              ) : (
                <ChevronUp size={14} className="text-vermilion" />
              )}
            </button>
            {!attentionCollapsed && (
              <div className="relative z-[1] flex flex-col px-4 pb-4">
                <StatusColumn
                  status={attentionStatus}
                  tasks={grouped.attention}
                  statuses={statuses}
                  onTaskClick={onTaskClick}
                  onUpdated={onUpdated}
                  onOptimisticPatch={onOptimisticPatch}
                  horizontal
                  hideHeader
                />
              </div>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {columnStatuses.map((status) => (
            <div
              key={status.id}
              className="bg-cream/60 border border-rule rounded-md p-4 relative flex flex-col h-full"
              style={{ minHeight: 320 }}
            >
              <div className="relative z-[1] flex flex-col h-full">
                <StatusColumn
                  status={status}
                  tasks={grouped.byStatus.get(status.id) || []}
                  statuses={statuses}
                  onTaskClick={onTaskClick}
                  onUpdated={onUpdated}
                onOptimisticPatch={onOptimisticPatch}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DragDropContext>
  );
}

export const KanbanBoard = memo(KanbanBoardInner);

"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";
import type { NotificationItem, UnreadNotifications } from "@/types";

export function NotificationBell() {
  const router = useRouter();
  const [data, setData] = useState<UnreadNotifications | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnread = useCallback(async () => {
    try {
      const r = await fetch("/api/notifications/unread");
      if (!r.ok) return;
      const json = await r.json();
      setData(json);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markAsRead = async (id: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/notifications/${id}/mark-as-read`, { method: "POST" });
      if (r.ok) {
        setData((prev) => {
          if (!prev) return prev;
          const next = prev.notifications.filter((n) => n.id !== id);
          return { count: Math.max(0, prev.count - 1), notifications: next };
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = async (n: NotificationItem) => {
    if (!n.projectId || !n.taskId) {
      // No navigation target — just mark as read
      await markAsRead(n.id);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`/api/notifications/${n.id}/mark-as-read`, { method: "POST" });
      if (r.ok) {
        setData((prev) => {
          if (!prev) return prev;
          const next = prev.notifications.filter((x) => x.id !== n.id);
          return { count: Math.max(0, prev.count - 1), notifications: next };
        });
      }
    } finally {
      setLoading(false);
    }
    setOpen(false);
    router.push(`/?projectId=${n.projectId}&taskId=${n.taskId}`);
  };

  const count = data?.count ?? 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="btn relative"
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={14} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-vermilion text-[9px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-auto sm:mt-2 w-72 sm:w-80 max-w-[calc(100vw-1rem)] origin-top-right rounded-md border border-rule bg-paper shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-rule">
            <h3 className="font-display text-sm">Notifications</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!data || data.notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-ash text-sm">
                No unread notifications
              </div>
            ) : (
              <ul className="divide-y divide-rule">
                {data.notifications.map((n) => (
                  <NotificationRow
                    key={n.id}
                    n={n}
                    onMark={() => markAsRead(n.id)}
                    onNavigate={() => handleNavigate(n)}
                    loading={loading}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  n,
  onMark,
  onNavigate,
  loading
}: {
  n: NotificationItem;
  onMark: () => void;
  onNavigate: () => void;
  loading: boolean;
}) {
  return (
    <li className="flex items-start gap-3 px-4 py-3 group">
      <div className="flex-1 min-w-0">
        <button
          className="text-sm text-ink leading-snug text-left w-full hover:underline"
          onClick={onNavigate}
          disabled={loading}
          title={n.projectId && n.taskId ? "Open task" : "Mark as read"}
        >
          {n.message}
        </button>
        <p className="text-[10px] text-ash mt-1">
          {new Date(n.createdAt).toLocaleString()}
        </p>
      </div>
      <button
        className="btn-ghost shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition"
        onClick={onMark}
        disabled={loading}
        title="Mark as read"
        aria-label="Mark as read"
      >
        <Check size={14} />
      </button>
    </li>
  );
}

"use client";

import { useActiveBoard } from "@/components/board-provider";
import { ItemDetailSheet } from "@/components/items/item-detail-sheet";
import { useReminders } from "@/hooks/use-reminders";
import type { Board, Reminder } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const SEEN_KEY = "pursuit_seen_reminders";
const POLL_MS = 60_000; // check for due reminders every minute
const RECENT_MS = 2 * 24 * 60 * 60 * 1000; // don't toast misses older than 2 days

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}
function saveSeen(seen: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-300)));
  } catch {
    /* ignore quota / unavailable storage */
  }
}

function reminderItem(r: Reminder) {
  return typeof r.itemId === "object" && r.itemId ? r.itemId : null;
}

/**
 * Polls for due reminders app-wide and pops a toast for each newly-due one.
 * Clicking the toast opens that entry's detail drawer in its board. Runs on
 * every page (mounted in the app layout). Independent of the email channel.
 */
export function ReminderWatcher() {
  const { data } = useReminders("open", { refetchInterval: POLL_MS });
  const { boards, setActiveBoardId } = useActiveBoard();
  const router = useRouter();
  const boardById = useMemo(() => new Map(boards.map((b) => [b._id, b])), [boards]);
  const [selected, setSelected] = useState<{ itemId: string; board: Board } | null>(null);

  function openReminder(r: Reminder) {
    const item = reminderItem(r);
    const board = item?.boardId ? boardById.get(item.boardId) : undefined;
    if (!item?._id || !board) {
      router.push("/reminders"); // board missing — fall back to the list
      return;
    }
    setActiveBoardId(board._id);
    setSelected({ itemId: item._id, board });
  }

  const reminders = data?.reminders;

  useEffect(() => {
    if (!reminders || reminders.length === 0) return;
    const now = Date.now();
    const seen = loadSeen();

    const due = reminders.filter((r) => {
      if (r.done) return false;
      const at = new Date(r.notifyAt ?? r.dueDate).getTime();
      return at <= now && now - at < RECENT_MS && !seen.has(r._id);
    });
    if (due.length === 0) return;

    due.forEach((r) => seen.add(r._id));
    saveSeen(seen);

    if (due.length === 1) {
      const r = due[0];
      const item = reminderItem(r);
      toast(`Reminder: ${item?.title ?? "Follow-up"}`, {
        description: r.note || undefined,
        action: { label: "View", onClick: () => openReminder(r) },
        duration: 10_000,
      });
    } else {
      toast(`${due.length} reminders are due`, {
        description: "Open Reminders to see them all.",
        action: { label: "View", onClick: () => router.push("/reminders") },
        duration: 10_000,
      });
    }
    // openReminder/router are stable enough; re-run only when reminders change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders]);

  return selected ? (
    <ItemDetailSheet
      board={selected.board}
      itemId={selected.itemId}
      open={!!selected}
      onOpenChange={(o) => {
        if (!o) setSelected(null);
      }}
    />
  ) : null;
}

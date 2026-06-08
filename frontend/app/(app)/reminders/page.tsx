"use client";

import { PageHeader } from "@/components/app/page-header";
import { useActiveBoard } from "@/components/board-provider";
import { ItemDetailSheet } from "@/components/items/item-detail-sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteReminder, useReminders, useUpdateReminder } from "@/hooks/use-reminders";
import { fmtDate, isOverdue, isToday } from "@/lib/format";
import type { Board, Reminder } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BellOff, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

function reminderItem(r: Reminder) {
  return typeof r.itemId === "object" && r.itemId ? r.itemId : null;
}

function ReminderRow({
  r,
  board,
  onOpen,
}: {
  r: Reminder;
  board?: Board;
  onOpen: (r: Reminder) => void;
}) {
  const updateR = useUpdateReminder();
  const delR = useDeleteReminder();
  const overdue = !r.done && isOverdue(r.dueDate);
  const item = reminderItem(r);
  const title = item?.title ?? "Item";
  const canOpen = !!item?._id && !!board;

  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <input
        type="checkbox"
        checked={r.done}
        onChange={(e) => updateR.mutate({ id: r._id, data: { done: e.target.checked } })}
        className="h-4 w-4 shrink-0 accent-primary"
      />
      <button
        type="button"
        disabled={!canOpen}
        onClick={() => onOpen(r)}
        className="group min-w-0 flex-1 text-left disabled:cursor-default"
      >
        <p
          className={cn(
            "truncate text-sm font-medium",
            r.done && "text-muted-foreground line-through",
            canOpen && "group-hover:underline",
          )}
        >
          {title}
        </p>
        <div className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          {board && (
            <span className="inline-flex shrink-0 items-center gap-1">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: board.color }}
              />
              {board.name}
            </span>
          )}
          {r.note && <span className="truncate">· {r.note}</span>}
        </div>
      </button>
      <span
        className={cn(
          "shrink-0 text-xs",
          overdue ? "font-medium text-destructive" : "text-muted-foreground",
        )}
      >
        {fmtDate(r.dueDate)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground"
        onClick={() => delR.mutate(r._id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}

function Section({
  label,
  items,
  boardById,
  onOpen,
}: {
  label: string;
  items: Reminder[];
  boardById: Map<string, Board>;
  onOpen: (r: Reminder) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">
        {label} <span className="text-xs">({items.length})</span>
      </h2>
      <ul className="space-y-2">
        {items.map((r) => {
          const item = reminderItem(r);
          const board = item?.boardId ? boardById.get(item.boardId) : undefined;
          return <ReminderRow key={r._id} r={r} board={board} onOpen={onOpen} />;
        })}
      </ul>
    </div>
  );
}

export default function RemindersPage() {
  const { data, isLoading } = useReminders();
  const { boards, setActiveBoardId } = useActiveBoard();
  const all = data?.reminders ?? [];

  const boardById = useMemo(() => new Map(boards.map((b) => [b._id, b])), [boards]);
  const [selected, setSelected] = useState<{ itemId: string; board: Board } | null>(null);

  function openReminder(r: Reminder) {
    const item = reminderItem(r);
    const board = item?.boardId ? boardById.get(item.boardId) : undefined;
    if (!item?._id || !board) return;
    setActiveBoardId(board._id); // so closing the entry lands on its board
    setSelected({ itemId: item._id, board });
  }

  const open = all.filter((r) => !r.done);
  const overdue = open.filter((r) => isOverdue(r.dueDate));
  const today = open.filter((r) => isToday(new Date(r.dueDate)));
  const upcoming = open.filter((r) => !isOverdue(r.dueDate) && !isToday(new Date(r.dueDate)));
  const done = all.filter((r) => r.done);

  const empty = !isLoading && all.length === 0;

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Reminders" description="Your follow-ups across every board." />

      <div className="space-y-6 p-4 sm:p-6">
        {isLoading ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : empty ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BellOff className="h-6 w-6" />
            </span>
            <div>
              <p className="font-medium">You&apos;re all caught up</p>
              <p className="text-sm text-muted-foreground">
                Add follow-up reminders from any item&apos;s detail panel.
              </p>
            </div>
          </div>
        ) : (
          <>
            <Section label="Overdue" items={overdue} boardById={boardById} onOpen={openReminder} />
            <Section label="Today" items={today} boardById={boardById} onOpen={openReminder} />
            <Section label="Upcoming" items={upcoming} boardById={boardById} onOpen={openReminder} />
            <Section label="Completed" items={done} boardById={boardById} onOpen={openReminder} />
          </>
        )}
      </div>

      {selected && (
        <ItemDetailSheet
          board={selected.board}
          itemId={selected.itemId}
          open={!!selected}
          onOpenChange={(o) => {
            if (!o) setSelected(null);
          }}
        />
      )}
    </div>
  );
}

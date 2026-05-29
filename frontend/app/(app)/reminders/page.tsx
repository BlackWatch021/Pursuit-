"use client";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteReminder, useReminders, useUpdateReminder } from "@/hooks/use-reminders";
import { fmtDate, isOverdue, isToday } from "@/lib/format";
import type { Reminder } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BellOff, Trash2 } from "lucide-react";

function refTitle(r: Reminder): string {
  return typeof r.itemId === "object" && r.itemId ? r.itemId.title : "Application";
}

function ReminderRow({ r }: { r: Reminder }) {
  const updateR = useUpdateReminder();
  const delR = useDeleteReminder();
  const overdue = !r.done && isOverdue(r.dueDate);

  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <input
        type="checkbox"
        checked={r.done}
        onChange={(e) => updateR.mutate({ id: r._id, data: { done: e.target.checked } })}
        className="h-4 w-4 accent-primary"
      />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", r.done && "text-muted-foreground line-through")}>
          {refTitle(r)}
        </p>
        {r.note && <p className="truncate text-xs text-muted-foreground">{r.note}</p>}
      </div>
      <span className={cn("shrink-0 text-xs", overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
        {fmtDate(r.dueDate)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground"
        onClick={() => delR.mutate(r._id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}

function Section({ label, items }: { label: string; items: Reminder[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">
        {label} <span className="text-xs">({items.length})</span>
      </h2>
      <ul className="space-y-2">
        {items.map((r) => (
          <ReminderRow key={r._id} r={r} />
        ))}
      </ul>
    </div>
  );
}

export default function RemindersPage() {
  const { data, isLoading } = useReminders();
  const all = data?.reminders ?? [];

  const open = all.filter((r) => !r.done);
  const overdue = open.filter((r) => isOverdue(r.dueDate));
  const today = open.filter((r) => isToday(new Date(r.dueDate)));
  const upcoming = open.filter((r) => !isOverdue(r.dueDate) && !isToday(new Date(r.dueDate)));
  const done = all.filter((r) => r.done);

  const empty = !isLoading && all.length === 0;

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Reminders" description="Your follow-ups across every application." />

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
                Add follow-up reminders from any application&apos;s detail panel.
              </p>
            </div>
          </div>
        ) : (
          <>
            <Section label="Overdue" items={overdue} />
            <Section label="Today" items={today} />
            <Section label="Upcoming" items={upcoming} />
            <Section label="Completed" items={done} />
          </>
        )}
      </div>
    </div>
  );
}

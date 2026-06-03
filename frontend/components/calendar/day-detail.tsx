"use client";

import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/format";
import type { CalendarEvent, CalendarItem, Stage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Bell, X } from "lucide-react";

/** Details for a single clicked day, shown beneath the calendar. */
export function DayDetail({
  date,
  items,
  events,
  stages,
  onClose,
}: {
  date: string;
  items: CalendarItem[];
  events: CalendarEvent[];
  stages: Stage[];
  onClose: () => void;
}) {
  const stageOf = (id: string) => stages.find((s) => s.id === id);

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-medium">{fmtDate(date)}</h2>
          <p className="text-xs text-muted-foreground">
            {items.length} application{items.length === 1 ? "" : "s"}
            {events.length > 0 &&
              ` · ${events.length} reminder${events.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
          aria-label="Close day details"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {items.length === 0 && events.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing happened on this day.</p>
      ) : (
        <div className="space-y-4">
          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((it) => {
                const s = stageOf(it.stageId);
                return (
                  <div
                    key={it.id}
                    className="flex items-center justify-between gap-2 rounded-lg border p-2.5"
                  >
                    <span className="truncate text-sm font-medium">{it.title}</span>
                    {s && (
                      <span
                        className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium"
                        style={{
                          backgroundColor: `color-mix(in oklab, ${s.color} 16%, transparent)`,
                          color: s.color,
                        }}
                      >
                        {s.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {events.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Reminders</p>
              {events.map((e) => (
                <div
                  key={e.id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2.5 text-sm",
                    e.done && "text-muted-foreground line-through",
                  )}
                >
                  <Bell className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span className="truncate">
                    {e.title}
                    {e.note && ` — ${e.note}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

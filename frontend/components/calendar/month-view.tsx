"use client";

import { Button } from "@/components/ui/button";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ymd = (d: Date) => d.toISOString().slice(0, 10);

export function MonthView({
  year,
  month,
  counts,
  events,
  onPrev,
  onNext,
  onSelectDate,
  selected,
}: {
  year: number;
  month: number;
  counts: Map<string, number>;
  events: CalendarEvent[];
  onPrev: () => void;
  onNext: () => void;
  onSelectDate?: (date: string) => void;
  selected?: string | null;
}) {
  const eventsByDay = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = e.date.slice(0, 10);
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key)!.push(e);
  }

  const gridStart = new Date(Date.UTC(year, month, 1));
  gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay());

  const days: Date[] = [];
  const cur = new Date(gridStart);
  for (let i = 0; i < 42; i++) {
    days.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  const todayKey = ymd(new Date());

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {MONTHS[month]} {year}
        </h3>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-sm">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-card px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = ymd(day);
          const inMonth = day.getUTCMonth() === month;
          const count = counts.get(key) ?? 0;
          const dayEvents = eventsByDay.get(key) ?? [];
          return (
            <div
              key={key}
              onClick={() => onSelectDate?.(key)}
              className={cn(
                "min-h-20 bg-card p-1.5 align-top",
                onSelectDate && "cursor-pointer transition-colors hover:bg-muted/50",
                !inMonth && "bg-muted/40 text-muted-foreground",
                selected === key && "ring-2 ring-inset ring-primary",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-xs",
                    key === todayKey &&
                      "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground",
                  )}
                >
                  {day.getUTCDate()}
                </span>
                {count > 0 && (
                  <span className="rounded bg-indigo-500/15 px-1 text-[10px] font-medium text-indigo-600 dark:text-indigo-300">
                    {count}
                  </span>
                )}
              </div>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map((e) => (
                  <div
                    key={e.id}
                    title={e.title}
                    className={cn(
                      "truncate rounded px-1 py-0.5 text-[10px]",
                      e.done
                        ? "bg-muted text-muted-foreground line-through"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                    )}
                  >
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="px-1 text-[10px] text-muted-foreground">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

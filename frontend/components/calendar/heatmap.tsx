"use client";

import { cn } from "@/lib/utils";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const LEVEL_CLASSES = [
  "bg-muted",
  "bg-indigo-200 dark:bg-indigo-900",
  "bg-indigo-300 dark:bg-indigo-700",
  "bg-indigo-400 dark:bg-indigo-600",
  "bg-indigo-500 dark:bg-indigo-400",
];

const ymd = (d: Date) => d.toISOString().slice(0, 10);

function levelOf(count: number, max: number): number {
  if (count <= 0) return 0;
  if (max <= 1) return 4;
  const r = count / max;
  if (r > 0.75) return 4;
  if (r > 0.5) return 3;
  if (r > 0.25) return 2;
  return 1;
}

export function Heatmap({
  data,
  year,
  onSelectDate,
  selected,
}: {
  data: { date: string; count: number }[];
  year: number;
  onSelectDate?: (date: string) => void;
  selected?: string | null;
}) {
  const counts = new Map(data.map((d) => [d.date, d.count]));
  const max = Math.max(1, ...data.map((d) => d.count));

  // Build weeks (columns) spanning the whole year, aligned to Sundays (UTC).
  const start = new Date(Date.UTC(year, 0, 1));
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const end = new Date(Date.UTC(year, 11, 31));
  end.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay()));

  const weeks: Date[][] = [];
  const cur = new Date(start);
  while (cur <= end) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    weeks.push(week);
  }

  let lastMonth = -1;
  const monthLabels = weeks.map((week) => {
    const first = week[0];
    if (first.getUTCFullYear() === year && first.getUTCMonth() !== lastMonth) {
      lastMonth = first.getUTCMonth();
      return MONTHS[lastMonth];
    }
    return "";
  });

  return (
    <div>
      <div className="scrollbar-thin overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-1">
          <div className="flex gap-1">
            {monthLabels.map((label, i) => (
              <div key={i} className="w-3 whitespace-nowrap text-[10px] text-muted-foreground">
                {label}
              </div>
            ))}
          </div>
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day) => {
                  const inYear = day.getUTCFullYear() === year;
                  const key = ymd(day);
                  if (!inYear) {
                    return <div key={key} className="h-3 w-3 rounded-[3px] bg-transparent" />;
                  }
                  const count = counts.get(key) ?? 0;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onSelectDate?.(key)}
                      title={`${count} application${count === 1 ? "" : "s"} · ${key}`}
                      className={cn(
                        "h-3 w-3 rounded-[3px] transition-transform hover:ring-1 hover:ring-ring",
                        LEVEL_CLASSES[levelOf(count, max)],
                        selected === key && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Less</span>
        {LEVEL_CLASSES.map((c, i) => (
          <span key={i} className={cn("h-3 w-3 rounded-[3px]", c)} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

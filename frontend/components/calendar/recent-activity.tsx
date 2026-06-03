"use client";

import { fmtDate, fmtRelative } from "@/lib/format";
import type { ActivityType, CalendarActivity, Stage } from "@/lib/types";
import { Bell, FilePlus2, MoveRight, Pencil, StickyNote } from "lucide-react";
import type { ReactNode } from "react";

const ICON: Record<ActivityType, typeof StickyNote> = {
  created: FilePlus2,
  stage_change: MoveRight,
  note: StickyNote,
  reminder: Bell,
  field_change: Pencil,
};

function describe(a: CalendarActivity, stageName: (id?: string) => string): ReactNode {
  const title = <span className="font-medium">{a.itemTitle}</span>;
  switch (a.type) {
    case "created":
      return <>Added {title}</>;
    case "stage_change":
      return (
        <>
          Moved {title} to {stageName(a.toStageId)}
        </>
      );
    case "note":
      return (
        <>
          Note on {title}
          {a.content && `: ${a.content}`}
        </>
      );
    case "reminder":
      return <>Reminder set for {title}</>;
    case "field_change":
      return <>Updated {title}</>;
    default:
      return title;
  }
}

/** GitHub-style activity feed grouped by day, shown beneath the calendar. */
export function RecentActivity({
  activities,
  stages,
}: {
  activities: CalendarActivity[];
  stages: Stage[];
}) {
  const stageName = (id?: string) => stages.find((s) => s.id === id)?.name ?? "a stage";

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-1 text-sm font-medium">Recent activity</h2>
        <p className="text-sm text-muted-foreground">No activity yet this year.</p>
      </div>
    );
  }

  // Activities arrive newest-first; group consecutive ones by calendar day.
  const groups: { date: string; items: CalendarActivity[] }[] = [];
  for (const a of activities) {
    const day = a.createdAt.slice(0, 10);
    const last = groups[groups.length - 1];
    if (last && last.date === day) last.items.push(a);
    else groups.push({ date: day, items: [a] });
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="mb-4 text-sm font-medium">Recent activity</h2>
      <div className="space-y-5">
        {groups.map((g) => (
          <div key={g.date}>
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              {fmtDate(g.date)}
            </div>
            <ul className="space-y-2.5 border-l pl-4">
              {g.items.map((a) => {
                const Icon = ICON[a.type] ?? StickyNote;
                return (
                  <li key={a.id} className="relative flex items-start gap-2 text-sm">
                    <span className="absolute -left-[1.45rem] flex h-5 w-5 items-center justify-center rounded-full border bg-card">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="leading-snug">{describe(a, stageName)}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtRelative(a.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

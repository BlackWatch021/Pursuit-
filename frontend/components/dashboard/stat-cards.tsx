import type { DashboardData } from "@/lib/types";
import { Activity, CalendarPlus, CheckCircle2, Layers } from "lucide-react";

export function StatCards({
  stats,
  itemsLabel = "items",
}: {
  stats: DashboardData["stats"];
  itemsLabel?: string;
}) {
  const cards = [
    { label: `Total ${itemsLabel}`, value: String(stats.total), icon: Layers },
    { label: "Active", value: String(stats.active), icon: Activity },
    { label: "Added this week", value: String(stats.addedThisWeek), icon: CalendarPlus },
    { label: "Completion rate", value: `${stats.completionRate}%`, icon: CheckCircle2 },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <c.icon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

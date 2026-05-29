import type { DashboardData } from "@/lib/types";
import { Activity, Briefcase, MessagesSquare, Trophy } from "lucide-react";

export function StatCards({ stats }: { stats: DashboardData["stats"] }) {
  const cards = [
    { label: "Total applications", value: String(stats.total), icon: Briefcase },
    { label: "Active in pipeline", value: String(stats.active), icon: Activity },
    { label: "Interview rate", value: `${stats.interviewRate}%`, icon: MessagesSquare },
    { label: "Offer rate", value: `${stats.offerRate}%`, icon: Trophy },
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

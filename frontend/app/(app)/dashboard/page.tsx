"use client";

import { PageHeader } from "@/components/app/page-header";
import { Funnel } from "@/components/dashboard/funnel";
import { StatCards } from "@/components/dashboard/stat-cards";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/use-dashboard";
import { useUpdateReminder } from "@/hooks/use-reminders";
import { fmtDate, fmtRelative, isOverdue } from "@/lib/format";
import type { Activity, Reminder, Stage } from "@/lib/types";
import { ArrowRight, Bell, Briefcase, Plus, Sparkles, StickyNote } from "lucide-react";
import Link from "next/link";

function refTitle(ref: Activity["itemId"] | Reminder["itemId"]): string {
  return typeof ref === "object" && ref ? ref.title : "Application";
}

function ActivityLine({ a, stages }: { a: Activity; stages: Stage[] }) {
  const title = refTitle(a.itemId);
  const stageName = (id?: string) => stages.find((s) => s.id === id)?.name ?? "—";

  let icon = <Sparkles className="h-3.5 w-3.5" />;
  let text = (
    <>
      Created <span className="font-medium">{title}</span>
    </>
  );
  if (a.type === "note") {
    icon = <StickyNote className="h-3.5 w-3.5" />;
    text = (
      <>
        Note on <span className="font-medium">{title}</span>
      </>
    );
  } else if (a.type === "stage_change") {
    icon = <ArrowRight className="h-3.5 w-3.5" />;
    text = (
      <>
        Moved <span className="font-medium">{title}</span> to{" "}
        <span className="font-medium">{stageName(a.toStageId)}</span>
      </>
    );
  }

  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="truncate">{text}</p>
        <p className="text-xs text-muted-foreground">{fmtRelative(a.createdAt)}</p>
      </div>
    </li>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const updateReminder = useUpdateReminder();

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Dashboard" description="Your job hunt at a glance.">
        <Button asChild>
          <Link href="/board">
            <Plus className="mr-1.5 h-4 w-4" />
            New application
          </Link>
        </Button>
      </PageHeader>

      <div className="space-y-6 p-4 sm:p-6">
        {isLoading || !data ? (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </>
        ) : data.stats.total === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-20 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Briefcase className="h-6 w-6" />
            </span>
            <div>
              <p className="font-medium">No applications yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first application to start tracking your pipeline.
              </p>
            </div>
            <Button asChild>
              <Link href="/board">
                <Plus className="mr-1.5 h-4 w-4" />
                Add your first application
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <StatCards stats={data.stats} />

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-xl border bg-card p-5 lg:col-span-2">
                <h2 className="mb-4 text-sm font-medium">Pipeline funnel</h2>
                <Funnel steps={data.funnel} />
              </div>
              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-4 text-sm font-medium">Applications per week</h2>
                <WeeklyChart data={data.weeks} />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Upcoming follow-ups */}
              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-medium">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  Upcoming follow-ups
                </h2>
                {data.reminders.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    You&apos;re all caught up.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {data.reminders.map((r) => (
                      <li key={r._id} className="flex items-center gap-3 rounded-lg border p-3">
                        <input
                          type="checkbox"
                          checked={r.done}
                          onChange={(e) =>
                            updateReminder.mutate({ id: r._id, data: { done: e.target.checked } })
                          }
                          className="h-4 w-4 accent-primary"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{refTitle(r.itemId)}</p>
                          {r.note && (
                            <p className="truncate text-xs text-muted-foreground">{r.note}</p>
                          )}
                        </div>
                        <span
                          className={
                            isOverdue(r.dueDate)
                              ? "shrink-0 text-xs font-medium text-destructive"
                              : "shrink-0 text-xs text-muted-foreground"
                          }
                        >
                          {fmtDate(r.dueDate)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Recent activity */}
              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-4 text-sm font-medium">Recent activity</h2>
                {data.recent.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {data.recent.map((a) => (
                      <ActivityLine key={a._id} a={a} stages={data.board.stages} />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

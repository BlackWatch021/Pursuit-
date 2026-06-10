"use client";

import { PageHeader } from "@/components/app/page-header";
import { useActiveBoard } from "@/components/board-provider";
import { ItemDetailSheet } from "@/components/items/item-detail-sheet";
import { Funnel } from "@/components/dashboard/funnel";
import { StatCards } from "@/components/dashboard/stat-cards";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/use-dashboard";
import { useUpdateReminder } from "@/hooks/use-reminders";
import { itemNoun } from "@/lib/board-utils";
import { fmtDateTime, fmtRelative, isOverdue } from "@/lib/format";
import type { Activity, Board, Reminder, Stage } from "@/lib/types";
import { ArrowRight, Bell, Briefcase, Pencil, Plus, Sparkles, StickyNote } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

function refTitle(ref: Activity["itemId"] | Reminder["itemId"]): string {
  return typeof ref === "object" && ref ? ref.title : "Item";
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
  } else if (a.type === "field_change") {
    const label = (a.meta as { label?: string } | undefined)?.label;
    icon = <Pencil className="h-3.5 w-3.5" />;
    text = (
      <>
        Updated {label ? <span className="font-medium">{label}</span> : "a field"} on{" "}
        <span className="font-medium">{title}</span>
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
  const { activeBoard, activeBoardId, boards, setActiveBoardId } = useActiveBoard();
  const { data, isLoading } = useDashboard(activeBoardId ?? undefined);
  const updateReminder = useUpdateReminder();
  const noun = itemNoun(activeBoard);

  const boardById = useMemo(() => new Map(boards.map((b) => [b._id, b])), [boards]);
  const [selected, setSelected] = useState<{ itemId: string; board: Board } | null>(null);

  function openReminder(r: Reminder) {
    const item = typeof r.itemId === "object" && r.itemId ? r.itemId : null;
    const board = item?.boardId ? boardById.get(item.boardId) : undefined;
    if (!item?._id || !board) return;
    setActiveBoardId(board._id);
    setSelected({ itemId: item._id, board });
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Dashboard" description={`Your ${noun.lowerPlural} at a glance.`}>
        <Button asChild>
          <Link href="/board">
            <Plus className="mr-1.5 h-4 w-4" />
            New {noun.lower}
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
              <p className="font-medium">No {noun.lowerPlural} yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first {noun.lower} to start tracking your pipeline.
              </p>
            </div>
            <Button asChild>
              <Link href="/board">
                <Plus className="mr-1.5 h-4 w-4" />
                Add your first {noun.lower}
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <StatCards stats={data.stats} itemsLabel={noun.lowerPlural} />

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-xl border bg-card p-5 lg:col-span-2">
                <h2 className="mb-4 text-sm font-medium">{noun.plural} by stage</h2>
                <Funnel steps={data.funnel} />
              </div>
              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-4 text-sm font-medium">{noun.plural} per week</h2>
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
                    {data.reminders.map((r) => {
                      const item =
                        typeof r.itemId === "object" && r.itemId ? r.itemId : null;
                      const board = item?.boardId ? boardById.get(item.boardId) : undefined;
                      const canOpen = !!item?._id && !!board;
                      return (
                        <li key={r._id} className="flex items-center gap-3 rounded-lg border p-3">
                          <input
                            type="checkbox"
                            checked={r.done}
                            onChange={(e) =>
                              updateReminder.mutate({ id: r._id, data: { done: e.target.checked } })
                            }
                            className="h-4 w-4 shrink-0 accent-primary"
                          />
                          <button
                            type="button"
                            disabled={!canOpen}
                            onClick={() => openReminder(r)}
                            className="group min-w-0 flex-1 text-left disabled:cursor-default"
                          >
                            <p
                              className={`truncate text-sm font-medium ${canOpen ? "group-hover:underline" : ""}`}
                            >
                              {refTitle(r.itemId)}
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
                            className={
                              isOverdue(r.dueDate)
                                ? "shrink-0 text-xs font-medium text-destructive"
                                : "shrink-0 text-xs text-muted-foreground"
                            }
                          >
                            {fmtDateTime(r.dueDate)}
                          </span>
                        </li>
                      );
                    })}
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

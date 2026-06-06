"use client";

import { PageHeader } from "@/components/app/page-header";
import { useActiveBoard } from "@/components/board-provider";
import { DayDetail } from "@/components/calendar/day-detail";
import { Heatmap } from "@/components/calendar/heatmap";
import { MonthView } from "@/components/calendar/month-view";
import { RecentActivity } from "@/components/calendar/recent-activity";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCalendar } from "@/hooks/use-dashboard";
import { itemNoun } from "@/lib/board-utils";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function CalendarPage() {
  const now = new Date();
  const [view, setView] = useState<"heatmap" | "month">("heatmap");
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { activeBoard, activeBoardId } = useActiveBoard();
  const { data, isLoading } = useCalendar(year, activeBoardId ?? undefined);
  const noun = itemNoun(activeBoard);

  const counts = new Map((data?.heatmap ?? []).map((d) => [d.date, d.count]));
  const total = (data?.heatmap ?? []).reduce((sum, d) => sum + d.count, 0);
  const busiest = Math.max(0, ...(data?.heatmap ?? []).map((d) => d.count));

  const dayItems = selectedDate
    ? (data?.items ?? []).filter((it) => it.primaryDate.slice(0, 10) === selectedDate)
    : [];
  const dayEvents = selectedDate
    ? (data?.events ?? []).filter((e) => e.date.slice(0, 10) === selectedDate)
    : [];

  function changeYear(delta: number) {
    setYear((y) => y + delta);
    setSelectedDate(null);
  }
  function prevMonth() {
    setSelectedDate(null);
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    setSelectedDate(null);
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Calendar"
        description={`${total} ${total === 1 ? noun.lower : noun.lowerPlural} in ${year}`}
      >
        <div className="inline-flex rounded-lg border p-0.5">
          <Button
            variant={view === "heatmap" ? "secondary" : "ghost"}
            size="sm"
            className="h-7"
            onClick={() => setView("heatmap")}
          >
            Heatmap
          </Button>
          <Button
            variant={view === "month" ? "secondary" : "ghost"}
            size="sm"
            className="h-7"
            onClick={() => setView("month")}
          >
            Month
          </Button>
        </div>
      </PageHeader>

      <div className="space-y-6 p-4 sm:p-6">
        {isLoading || !data ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <>
            {view === "heatmap" ? (
              <div className="rounded-xl border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className={cn("text-sm font-medium")}>{year}</h2>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeYear(-1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeYear(1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Heatmap
                  data={data.heatmap}
                  year={year}
                  onSelectDate={setSelectedDate}
                  selected={selectedDate}
                  noun={noun}
                />
                <p className="mt-4 text-xs text-muted-foreground">
                  Busiest day: {busiest} {busiest === 1 ? noun.lower : noun.lowerPlural}. Click a day
                  for details.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-5">
                <MonthView
                  year={year}
                  month={month}
                  counts={counts}
                  events={data.events}
                  onPrev={prevMonth}
                  onNext={nextMonth}
                  onSelectDate={setSelectedDate}
                  selected={selectedDate}
                />
              </div>
            )}

            {selectedDate && (
              <DayDetail
                date={selectedDate}
                items={dayItems}
                events={dayEvents}
                stages={data.stages}
                onClose={() => setSelectedDate(null)}
                noun={noun}
              />
            )}

            <RecentActivity activities={data.recent} stages={data.stages} />
          </>
        )}
      </div>
    </div>
  );
}

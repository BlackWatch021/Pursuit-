"use client";

import { Badge } from "@/components/ui/badge";
import { itemNoun, sortedStages, stageMap } from "@/lib/board-utils";
import { fmtDateShort } from "@/lib/format";
import type { Board, Item, Priority } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";

const PRIORITY_RANK: Record<Priority, number> = { low: 0, medium: 1, high: 2 };
const PRIORITY_META: Record<Priority, { label: string; pill: string; dot: string }> = {
  high: {
    label: "High",
    pill: "bg-red-500/15 text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
  medium: {
    label: "Medium",
    pill: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  low: {
    label: "Low",
    pill: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
};

type SortKey = string;
type SortDir = "asc" | "desc";

/** A column descriptor: how to render and how to sort a cell. */
type Column = {
  key: SortKey;
  label: string;
  /** numeric columns sort by number; everything else by string/most-natural order */
  numeric?: boolean;
  /** comparable value for sorting (lower sorts first in "asc") */
  sortValue: (it: Item) => string | number;
};

const fieldValue = (it: Item, fieldId: string): string => {
  const v = it.fields?.[fieldId];
  return v == null ? "" : String(v);
};

export function BoardTable({
  board,
  items,
  onRowClick,
}: {
  board: Board;
  items: Item[];
  onRowClick: (id: string) => void;
}) {
  const stages = stageMap(board);
  const noun = itemNoun(board);
  const stageOrder = useMemo(() => {
    const order = new Map<string, number>();
    sortedStages(board).forEach((s, i) => order.set(s.id, i));
    return order;
  }, [board]);

  const columns = useMemo<Column[]>(() => {
    const fieldCols: Column[] = board.customFields.map((f) => ({
      key: `f:${f.id}`,
      label: f.name,
      numeric: f.type === "number" || f.type === "currency",
      sortValue: (it) => {
        const raw = fieldValue(it, f.id);
        if (f.type === "number" || f.type === "currency") {
          const n = parseFloat(raw.replace(/[^0-9.-]/g, ""));
          return Number.isNaN(n) ? -Infinity : n;
        }
        return raw.toLowerCase();
      },
    }));

    const cols: Column[] = [
      { key: "title", label: board.titleLabel, sortValue: (it) => it.title.toLowerCase() },
      {
        key: "stage",
        label: "Stage",
        sortValue: (it) => stageOrder.get(it.stageId) ?? 999,
        numeric: true,
      },
      ...fieldCols,
      {
        key: "date",
        label: board.dateLabel,
        sortValue: (it) => it.primaryDate,
      },
    ];
    if (board.showPriority) {
      cols.push({
        key: "priority",
        label: "Priority",
        sortValue: (it) => PRIORITY_RANK[it.priority],
        numeric: true,
      });
    }
    if (board.showTags) {
      cols.push({
        key: "tags",
        label: "Tags",
        sortValue: (it) => it.tags.join(",").toLowerCase(),
      });
    }
    return cols;
  }, [board, stageOrder]);

  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return items;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...items].sort((a, b) => {
      const av = col.sortValue(a);
      const bv = col.sortValue(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [items, columns, sortKey, sortDir]);

  return (
    <div className="scrollbar-thin h-full overflow-auto px-4 pb-6 sm:px-6">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0 z-10">
          <tr>
            {columns.map((col) => {
              const active = col.key === sortKey;
              return (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="cursor-pointer select-none whitespace-nowrap border-b bg-muted/50 px-3 py-2 text-left font-medium text-muted-foreground backdrop-blur hover:text-foreground"
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {active ? (
                      sortDir === "asc" ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )
                    ) : (
                      <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="border-b px-3 py-10 text-center text-sm text-muted-foreground"
              >
                No {noun.lowerPlural} yet.
              </td>
            </tr>
          )}
          {sorted.map((it) => {
            const stage = stages.get(it.stageId);
            const pri = PRIORITY_META[it.priority];
            return (
              <tr
                key={it._id}
                onClick={() => onRowClick(it._id)}
                className="cursor-pointer hover:bg-muted/40"
              >
                <td className="whitespace-nowrap border-b px-3 py-2 font-medium">
                  {it.title}
                </td>
                <td className="whitespace-nowrap border-b px-3 py-2">
                  {stage && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `color-mix(in oklab, ${stage.color} 16%, transparent)`,
                        color: stage.color,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      {stage.name}
                    </span>
                  )}
                </td>
                {board.customFields.map((f) => {
                  if (f.type === "multiselect") {
                    const raw = it.fields?.[f.id];
                    const arr = Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : [];
                    return (
                      <td key={f.id} className="border-b px-3 py-2">
                        {arr.length ? (
                          <div className="flex flex-wrap gap-1">
                            {arr.slice(0, 4).map((t) => (
                              <Badge
                                key={t}
                                variant="secondary"
                                className="px-1.5 py-0 text-[10px] font-normal"
                              >
                                {t}
                              </Badge>
                            ))}
                            {arr.length > 4 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{arr.length - 4}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    );
                  }
                  const val = fieldValue(it, f.id);
                  return (
                    <td
                      key={f.id}
                      className="max-w-[16rem] truncate border-b px-3 py-2"
                      title={val}
                    >
                      {val || <span className="text-muted-foreground">—</span>}
                    </td>
                  );
                })}
                <td className="whitespace-nowrap border-b px-3 py-2 text-muted-foreground">
                  {fmtDateShort(it.primaryDate)}
                </td>
                {board.showPriority && (
                  <td className="whitespace-nowrap border-b px-3 py-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs font-medium",
                        pri.pill,
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", pri.dot)} />
                      {pri.label}
                    </span>
                  </td>
                )}
                {board.showTags && (
                  <td className="border-b px-3 py-2">
                    {it.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {it.tags.slice(0, 4).map((t) => (
                          <Badge
                            key={t}
                            variant="secondary"
                            className="px-1.5 py-0 text-[10px] font-normal"
                          >
                            {t}
                          </Badge>
                        ))}
                        {it.tags.length > 4 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{it.tags.length - 4}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

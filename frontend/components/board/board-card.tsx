"use client";

import { Badge } from "@/components/ui/badge";
import { getField } from "@/lib/board-utils";
import { fmtDateShort } from "@/lib/format";
import type { Board, Item } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Banknote, MapPin } from "lucide-react";
import { forwardRef } from "react";

type ViewProps = {
  item: Item;
  board: Board;
  dragging?: boolean;
  dragColor?: string;
} & React.HTMLAttributes<HTMLDivElement>;

/** Pure visual card — used inside the sortable wrapper and in the drag overlay. */
export const BoardCardView = forwardRef<HTMLDivElement, ViewProps>(function BoardCardView(
  { item, board, dragging, dragColor, className, style, ...rest },
  ref,
) {
  const role = getField(item, board, "Role");
  const location = getField(item, board, "Location");
  const salary = getField(item, board, "Salary");

  return (
    <div
      ref={ref}
      style={{ ...style, ...(dragging && dragColor ? { borderColor: dragColor } : {}) }}
      className={cn(
        "group cursor-pointer touch-none select-none rounded-lg border bg-card p-3 shadow-sm transition-colors hover:border-primary/40",
        dragging && "rotate-1 border-2 shadow-lg",
        className,
      )}
      {...rest}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium leading-tight">{item.title}</p>
        {board.showPriority && item.priority === "high" && (
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" title="High priority" />
        )}
      </div>
      {role && <p className="mt-0.5 text-sm text-muted-foreground">{role}</p>}

      {(location || salary) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {location}
            </span>
          )}
          {salary && (
            <span className="flex items-center gap-1">
              <Banknote className="h-3 w-3" />
              {salary}
            </span>
          )}
        </div>
      )}

      {board.showTags && item.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
              {t}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-2 text-[11px] text-muted-foreground">{fmtDateShort(item.primaryDate)}</div>
    </div>
  );
});

/** Sortable, draggable card rendered inside a column's SortableContext. */
export function BoardCard({
  item,
  board,
  onClick,
  disabled,
}: {
  item: Item;
  board: Board;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item._id,
    disabled,
  });
  const style = { transform: CSS.Translate.toString(transform), transition };

  return (
    <BoardCardView
      ref={setNodeRef}
      item={item}
      board={board}
      onClick={onClick}
      style={style}
      className={cn(isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    />
  );
}

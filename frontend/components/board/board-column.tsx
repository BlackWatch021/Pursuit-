"use client";

import { Button } from "@/components/ui/button";
import type { Stage } from "@/lib/types";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

export function BoardColumn({
  stage,
  itemIds,
  onAdd,
  children,
}: {
  stage: Stage;
  itemIds: string[];
  onAdd: () => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div className="flex min-h-full w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
          <span className="text-sm font-medium">{stage.name}</span>
          <span
            className="rounded px-1.5 text-xs font-medium"
            style={{
              backgroundColor: `color-mix(in oklab, ${stage.color} 18%, transparent)`,
              color: stage.color,
            }}
          >
            {itemIds.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground"
          onClick={onAdd}
          aria-label={`Add to ${stage.name}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={setNodeRef}
        style={{
          backgroundColor: `color-mix(in oklab, ${stage.color} ${isOver ? 22 : 10}%, transparent)`,
          borderColor: isOver
            ? stage.color
            : `color-mix(in oklab, ${stage.color} 22%, transparent)`,
        }}
        className="flex min-h-24 flex-1 flex-col gap-2 rounded-xl border p-2 transition-colors"
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {children}
          {itemIds.length === 0 && (
            <div className="rounded-md py-8 text-center text-xs text-muted-foreground/70">
              No applications
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

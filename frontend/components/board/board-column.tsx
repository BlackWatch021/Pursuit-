"use client";

import { Button } from "@/components/ui/button";
import type { Stage } from "@/lib/types";
import { cn } from "@/lib/utils";
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
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
          <span className="text-sm font-medium">{stage.name}</span>
          <span className="rounded bg-muted px-1.5 text-xs text-muted-foreground">
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
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2 rounded-lg border border-dashed border-transparent p-1.5 transition-colors",
          isOver && "border-primary/40 bg-accent/40",
        )}
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

"use client";

import { useMoveItem } from "@/hooks/use-items";
import { sortedStages } from "@/lib/board-utils";
import type { Board, Item } from "@/lib/types";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useEffect, useMemo, useState } from "react";
import { BoardCard } from "./board-card";
import { BoardColumn } from "./board-column";

export function KanbanBoard({
  board,
  items,
  onCardClick,
  onAddInStage,
}: {
  board: Board;
  items: Item[];
  onCardClick: (id: string) => void;
  onAddInStage: (stageId: string) => void;
}) {
  const stages = useMemo(() => sortedStages(board), [board]);
  const move = useMoveItem();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [local, setLocal] = useState<Item[]>(items);

  useEffect(() => {
    setLocal(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const byStage = useMemo(() => {
    const map: Record<string, Item[]> = {};
    for (const s of stages) map[s.id] = [];
    for (const it of local) (map[it.stageId] ??= []).push(it);
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.order - b.order);
    return map;
  }, [local, stages]);

  const activeItem = local.find((i) => i._id === activeId) ?? null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const itemId = String(active.id);
    const overId = String(over.id);

    // The drop target is either a column (stage id) or another card (item id).
    let targetStage = stages.find((s) => s.id === overId)?.id;
    if (!targetStage) targetStage = local.find((i) => i._id === overId)?.stageId;
    if (!targetStage) return;

    const current = local.find((i) => i._id === itemId);
    if (!current || current.stageId === targetStage) return;

    const newOrder = byStage[targetStage]?.length ?? 0;
    setLocal((prev) =>
      prev.map((i) => (i._id === itemId ? { ...i, stageId: targetStage!, order: newOrder } : i)),
    );
    move.mutate({ id: itemId, stageId: targetStage, order: newOrder });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="scrollbar-thin flex h-full gap-4 overflow-auto p-4 sm:px-6">
        {stages.map((stage) => (
          <BoardColumn
            key={stage.id}
            stage={stage}
            count={byStage[stage.id]?.length ?? 0}
            onAdd={() => onAddInStage(stage.id)}
          >
            {(byStage[stage.id] ?? []).map((item) => (
              <BoardCard
                key={item._id}
                item={item}
                board={board}
                onClick={() => onCardClick(item._id)}
              />
            ))}
          </BoardColumn>
        ))}
      </div>

      <DragOverlay>
        {activeItem ? <BoardCard item={activeItem} board={board} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

"use client";

import { useReorderItems } from "@/hooks/use-items";
import { sortedStages } from "@/lib/board-utils";
import type { Board, Item } from "@/lib/types";
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useEffect, useMemo, useRef, useState } from "react";
import { BoardCard, BoardCardView } from "./board-card";
import { BoardColumn } from "./board-column";

type Columns = Record<string, Item[]>;

export function KanbanBoard({
  board,
  items,
  onCardClick,
  onAddInStage,
  dndDisabled,
}: {
  board: Board;
  items: Item[];
  onCardClick: (id: string) => void;
  onAddInStage: (stageId: string) => void;
  dndDisabled?: boolean;
}) {
  const stages = useMemo(() => sortedStages(board), [board]);
  const reorder = useReorderItems();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragColor, setDragColor] = useState<string | undefined>(undefined);

  const group = useMemo(
    () =>
      (list: Item[]): Columns => {
        const map: Columns = {};
        for (const s of stages) map[s.id] = [];
        for (const it of list) (map[it.stageId] ??= []).push(it);
        for (const k of Object.keys(map)) map[k] = [...map[k]].sort((a, b) => a.order - b.order);
        return map;
      },
    [stages],
  );

  const [columns, setColumns] = useState<Columns>(() => group(items));
  // Synchronous mirror of `columns` so drag handlers read the freshest arrangement
  // across rapid events. Written only in handlers (setCols) and this effect — never
  // during render.
  const columnsRef = useRef<Columns>(columns);
  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  // Reset the local arrangement when the server data (or board) changes. Tracked in
  // state (not a ref) and applied at render time — avoids both the effect-cascade
  // and the render-time ref-access warnings.
  const [synced, setSynced] = useState<{ items: Item[]; group: (l: Item[]) => Columns }>({
    items,
    group,
  });
  if (synced.items !== items || synced.group !== group) {
    setSynced({ items, group });
    setColumns(group(items));
  }

  // Single source of truth updated synchronously, so drag handlers never read a
  // value that a just-scheduled setState hasn't applied yet (that off-by-one was
  // the "works on odd drags, reverts on even" bug).
  function setCols(next: Columns) {
    columnsRef.current = next;
    setColumns(next);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function findContainer(id: string): string | undefined {
    const cols = columnsRef.current;
    if (cols[id]) return id;
    return Object.keys(cols).find((k) => cols[k].some((it) => it._id === id));
  }

  const activeItem = activeId
    ? Object.values(columns)
        .flat()
        .find((it) => it._id === activeId) ?? null
    : null;

  function onDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    setActiveId(id);
    setDragColor(stages.find((s) => s.id === findContainer(id))?.color);
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeKey = String(active.id);
    const overKey = String(over.id);
    const from = findContainer(activeKey);
    const to = findContainer(overKey);
    if (!from || !to) return;
    setDragColor(stages.find((s) => s.id === to)?.color);
    if (from === to) return;

    const current = columnsRef.current;
    const fromItems = current[from];
    const activeIndex = fromItems.findIndex((i) => i._id === activeKey);
    if (activeIndex < 0) return;
    const moved = fromItems[activeIndex];
    const toItems = current[to];
    let overIndex = toItems.findIndex((i) => i._id === overKey);
    if (overIndex < 0) overIndex = toItems.length;

    setCols({
      ...current,
      [from]: fromItems.filter((i) => i._id !== activeKey),
      [to]: [...toItems.slice(0, overIndex), { ...moved, stageId: to }, ...toItems.slice(overIndex)],
    });
  }

  function persist(cols: Columns) {
    const original = new Map(items.map((it) => [it._id, it]));
    const updates: { id: string; stageId: string; order: number }[] = [];
    for (const stageId of Object.keys(cols)) {
      cols[stageId].forEach((it, index) => {
        const orig = original.get(it._id);
        if (!orig) return;
        if (orig.stageId !== stageId || orig.order !== index) {
          updates.push({ id: it._id, stageId, order: index });
        }
      });
    }
    if (updates.length) reorder.mutate(updates);
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    setDragColor(undefined);
    if (!over) return;

    const activeKey = String(active.id);
    const overKey = String(over.id);
    const from = findContainer(activeKey);
    const to = findContainer(overKey);
    if (!from || !to) return;

    const current = columnsRef.current;
    let next = current;
    if (from === to) {
      const list = current[to];
      const oldIndex = list.findIndex((i) => i._id === activeKey);
      const newIndex = list.findIndex((i) => i._id === overKey);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        next = { ...current, [to]: arrayMove(list, oldIndex, newIndex) };
      }
    }

    setCols(next);
    persist(next);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setDragColor(undefined);
      }}
    >
      <div className="board-surface scrollbar-thin flex h-full items-start gap-4 overflow-auto p-4 sm:px-6">
        {stages.map((stage) => {
          const colItems = columns[stage.id] ?? [];
          return (
            <BoardColumn
              key={stage.id}
              stage={stage}
              itemIds={colItems.map((i) => i._id)}
              onAdd={() => onAddInStage(stage.id)}
            >
              {colItems.map((item) => (
                <BoardCard
                  key={item._id}
                  item={item}
                  board={board}
                  onClick={() => onCardClick(item._id)}
                  disabled={dndDisabled}
                />
              ))}
            </BoardColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeItem ? (
          <BoardCardView item={activeItem} board={board} dragging dragColor={dragColor} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

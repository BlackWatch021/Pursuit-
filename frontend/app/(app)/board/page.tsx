"use client";

import { PageHeader } from "@/components/app/page-header";
import { BoardFilters } from "@/components/board/board-filters";
import { KanbanBoard } from "@/components/board/kanban-board";
import { NewItemDialog } from "@/components/board/new-item-dialog";
import { ItemDetailSheet } from "@/components/items/item-detail-sheet";
import { Button } from "@/components/ui/button";
import { useBoards } from "@/hooks/use-boards";
import { useItems } from "@/hooks/use-items";
import type { Item, Priority } from "@/lib/types";
import { Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";

function itemText(it: Item): string {
  const fieldVals = Object.values(it.fields ?? {})
    .filter((v): v is string => typeof v === "string")
    .join(" ");
  return `${it.title} ${fieldVals} ${it.tags.join(" ")}`.toLowerCase();
}

export default function BoardPage() {
  const { data: boardsData, isLoading: boardsLoading } = useBoards();
  const board = boardsData?.boards[0];

  const { data: itemsData, isLoading: itemsLoading } = useItems(board?._id);
  const allItems = useMemo(() => itemsData?.items ?? [], [itemsData]);

  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);

  const [newOpen, setNewOpen] = useState(false);
  const [defaultStage, setDefaultStage] = useState<string | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const it of allItems) for (const t of it.tags) set.add(t);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [allItems]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allItems.filter((it) => {
      if (q && !itemText(it).includes(q)) return false;
      if (selectedTags.length && !selectedTags.some((t) => it.tags.includes(t))) return false;
      if (selectedPriorities.length && !selectedPriorities.includes(it.priority)) return false;
      return true;
    });
  }, [allItems, search, selectedTags, selectedPriorities]);

  const activeCount =
    (search.trim() ? 1 : 0) + selectedTags.length + selectedPriorities.length;

  function toggleTag(t: string) {
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }
  function togglePriority(p: Priority) {
    setSelectedPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }
  function clearFilters() {
    setSearch("");
    setSelectedTags([]);
    setSelectedPriorities([]);
  }

  if (boardsLoading || !board) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={board.name} description="Drag applications between stages to update them.">
        <Button
          onClick={() => {
            setDefaultStage(undefined);
            setNewOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          New application
        </Button>
      </PageHeader>

      <BoardFilters
        search={search}
        onSearch={setSearch}
        allTags={allTags}
        selectedTags={selectedTags}
        onToggleTag={toggleTag}
        selectedPriorities={selectedPriorities}
        onTogglePriority={togglePriority}
        onClear={clearFilters}
        activeCount={activeCount}
      />

      <div className="min-h-0 flex-1">
        {itemsLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activeCount > 0 && filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">No applications match your filters.</p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <KanbanBoard
            board={board}
            items={filtered}
            onCardClick={setSelectedId}
            onAddInStage={(stageId) => {
              setDefaultStage(stageId);
              setNewOpen(true);
            }}
          />
        )}
      </div>

      <NewItemDialog
        board={board}
        open={newOpen}
        onOpenChange={setNewOpen}
        defaultStageId={defaultStage}
      />
      <ItemDetailSheet
        board={board}
        itemId={selectedId}
        open={!!selectedId}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
      />
    </div>
  );
}

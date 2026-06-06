"use client";

import { PageHeader } from "@/components/app/page-header";
import { useActiveBoard } from "@/components/board-provider";
import { BoardFilters } from "@/components/board/board-filters";
import { BoardTable } from "@/components/board/board-table";
import { KanbanBoard } from "@/components/board/kanban-board";
import { NewItemDialog } from "@/components/board/new-item-dialog";
import { ItemDetailSheet } from "@/components/items/item-detail-sheet";
import { Button } from "@/components/ui/button";
import { useItems } from "@/hooks/use-items";
import { itemNoun } from "@/lib/board-utils";
import type { Item, Priority } from "@/lib/types";
import { LayoutGrid, Loader2, Plus, Table as TableIcon } from "lucide-react";
import { useMemo, useState } from "react";

function itemText(it: Item): string {
  const fieldVals = Object.values(it.fields ?? {})
    .flatMap((v) => (Array.isArray(v) ? v.map(String) : typeof v === "string" ? [v] : []))
    .join(" ");
  return `${it.title} ${fieldVals} ${it.tags.join(" ")}`.toLowerCase();
}

export default function BoardPage() {
  const { activeBoard: board, isLoading: boardsLoading } = useActiveBoard();

  const { data: itemsData, isLoading: itemsLoading } = useItems(board?._id);
  const allItems = useMemo(() => itemsData?.items ?? [], [itemsData]);

  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);

  const showTags = board?.showTags ?? true;
  const showPriority = board?.showPriority ?? true;

  // Clear filters when switching boards so a previous board's tags/priorities
  // don't carry over (render-time guard — see MEMORY §12).
  const [filterBoardId, setFilterBoardId] = useState<string | undefined>(undefined);
  if (board && board._id !== filterBoardId) {
    setFilterBoardId(board._id);
    if (search || selectedTags.length || selectedPriorities.length) {
      setSearch("");
      setSelectedTags([]);
      setSelectedPriorities([]);
    }
  }

  const [view, setView] = useState<"board" | "table">("board");
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
      if (showTags && selectedTags.length && !selectedTags.some((t) => it.tags.includes(t)))
        return false;
      if (showPriority && selectedPriorities.length && !selectedPriorities.includes(it.priority))
        return false;
      return true;
    });
  }, [allItems, search, selectedTags, selectedPriorities, showTags, showPriority]);

  const activeCount =
    (search.trim() ? 1 : 0) +
    (showTags ? selectedTags.length : 0) +
    (showPriority ? selectedPriorities.length : 0);

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

  const noun = itemNoun(board);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={board.name}
        description={
          view === "board"
            ? `Drag ${noun.lowerPlural} between stages to update them.`
            : `Click a row to open and edit ${/^[aeiou]/i.test(noun.lower) ? "an" : "a"} ${noun.lower}.`
        }
      >
        <Button
          onClick={() => {
            setDefaultStage(undefined);
            setNewOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          New {noun.lower}
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
        showTags={showTags}
        showPriority={showPriority}
      >
        <div className="inline-flex rounded-lg border p-0.5">
          <Button
            variant={view === "board" ? "secondary" : "ghost"}
            size="sm"
            className="h-7"
            onClick={() => setView("board")}
          >
            <LayoutGrid className="mr-1.5 h-4 w-4" />
            Board
          </Button>
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="sm"
            className="h-7"
            onClick={() => setView("table")}
          >
            <TableIcon className="mr-1.5 h-4 w-4" />
            Table
          </Button>
        </div>
      </BoardFilters>

      <div className="flex min-h-0 flex-1 flex-col">
        {view === "board" && activeCount > 0 && filtered.length > 0 && (
          <p className="px-4 pt-2 text-xs text-muted-foreground sm:px-6">
            Reordering is paused while filters are active — clear filters to rearrange cards.
          </p>
        )}
        <div className="min-h-0 flex-1">
          {itemsLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeCount > 0 && filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">No {noun.lowerPlural} match your filters.</p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : view === "board" ? (
            <KanbanBoard
              board={board}
              items={filtered}
              onCardClick={setSelectedId}
              onAddInStage={(stageId) => {
                setDefaultStage(stageId);
                setNewOpen(true);
              }}
              dndDisabled={activeCount > 0}
            />
          ) : (
            <BoardTable board={board} items={filtered} onRowClick={setSelectedId} />
          )}
        </div>
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

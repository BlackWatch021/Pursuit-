"use client";

import { PageHeader } from "@/components/app/page-header";
import { KanbanBoard } from "@/components/board/kanban-board";
import { NewItemDialog } from "@/components/board/new-item-dialog";
import { ItemDetailSheet } from "@/components/items/item-detail-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBoards } from "@/hooks/use-boards";
import { useItems } from "@/hooks/use-items";
import { Loader2, Plus, Search } from "lucide-react";
import { useState } from "react";

export default function BoardPage() {
  const { data: boardsData, isLoading: boardsLoading } = useBoards();
  const board = boardsData?.boards[0];

  const [search, setSearch] = useState("");
  const { data: itemsData, isLoading: itemsLoading } = useItems(board?._id, { search });

  const [newOpen, setNewOpen] = useState(false);
  const [defaultStage, setDefaultStage] = useState<string | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="h-9 w-40 pl-8 sm:w-52"
          />
        </div>
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

      <div className="min-h-0 flex-1">
        {itemsLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <KanbanBoard
            board={board}
            items={itemsData?.items ?? []}
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

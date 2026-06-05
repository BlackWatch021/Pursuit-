"use client";

import { useActiveBoard } from "@/components/board-provider";
import { CreateBoardDialog } from "@/components/board/create-board-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";

export function BoardSwitcher() {
  const { boards, activeBoard, activeBoardId, setActiveBoardId } = useActiveBoard();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-9 w-full justify-between gap-2 px-2.5">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: activeBoard?.color ?? "#6366f1" }}
              />
              <span className="truncate text-sm font-medium">
                {activeBoard?.name ?? "Select board"}
              </span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[13.5rem]">
          {boards.map((b) => (
            <DropdownMenuItem
              key={b._id}
              onClick={() => setActiveBoardId(b._id)}
              className="gap-2"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: b.color }}
              />
              <span className="flex-1 truncate">{b.name}</span>
              {b._id === activeBoardId && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New board
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateBoardDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

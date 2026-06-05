"use client";

import { useActiveBoard } from "@/components/board-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateBoard } from "@/hooks/use-boards";
import { ApiError } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";

// Starter stages so a new board is usable immediately (editable in Settings).
const DEFAULT_STAGES = [
  { name: "To do", order: 0, color: "#6366f1" },
  { name: "In progress", order: 1, color: "#f59e0b" },
  { name: "Done", order: 2, color: "#10b981" },
];

export function CreateBoardDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const create = useCreateBoard();
  const { setActiveBoardId } = useActiveBoard();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");

  function handleOpenChange(next: boolean) {
    if (!next) {
      setName("");
      setColor("#6366f1");
    }
    onOpenChange(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Board name is required");
      return;
    }
    try {
      const res = await create.mutateAsync({ name: name.trim(), color, stages: DEFAULT_STAGES });
      setActiveBoardId(res.board._id);
      toast.success("Board created");
      handleOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't create board");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New board</DialogTitle>
          <DialogDescription>
            A board is a separate tracker. It starts with To do / In progress / Done — customize it
            in Settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="board-name">Name</Label>
            <Input
              id="board-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Reading list, Job hunt, Courses…"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="board-color">Color</Label>
            <input
              id="board-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-14 cursor-pointer rounded border bg-transparent"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create board"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

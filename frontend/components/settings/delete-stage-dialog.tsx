"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDeleteStage } from "@/hooks/use-boards";
import { ApiError } from "@/lib/api";
import { itemNoun } from "@/lib/board-utils";
import type { Board, Stage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function DeleteStageDialog({
  board,
  stage,
  count,
  open,
  onOpenChange,
}: {
  board: Board;
  stage: Stage | null;
  count: number;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const del = useDeleteStage(board._id);
  const noun = itemNoun(board);
  const otherStages = board.stages.filter((s) => s.id !== stage?.id);
  const [mode, setMode] = useState<"move" | "delete">("move");
  const [target, setTarget] = useState<string>("");

  useEffect(() => {
    if (open) {
      setMode("move");
      setTarget(otherStages[0]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stage?.id]);

  if (!stage) return null;

  const empty = count === 0;
  const destructive = !empty && mode === "delete";

  async function confirm() {
    if (!stage) return;
    try {
      if (!empty && mode === "move") {
        if (!target) {
          toast.error(`Pick a stage to move ${noun.lowerPlural} to`);
          return;
        }
        await del.mutateAsync({ stageId: stage.id, strategy: "move", targetStageId: target });
      } else {
        await del.mutateAsync({ stageId: stage.id, strategy: "delete" });
      }
      toast.success(`Deleted “${stage.name}”`);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't delete the stage");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete “{stage.name}”</DialogTitle>
          <DialogDescription>
            {empty
              ? "This stage is empty. It will be removed from your board."
              : `This stage has ${count} ${count === 1 ? noun.lower : noun.lowerPlural}. What should happen to ${count === 1 ? "it" : "them"}?`}
          </DialogDescription>
        </DialogHeader>

        {!empty && (
          <div className="space-y-2">
            {/* Move option */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setMode("move")}
              className={cn(
                "w-full cursor-pointer rounded-lg border p-3 transition-colors",
                mode === "move" ? "border-primary bg-accent/50" : "hover:bg-accent/30",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full border",
                    mode === "move" ? "border-primary" : "border-muted-foreground/40",
                  )}
                >
                  {mode === "move" && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                <span className="text-sm font-medium">Move {noun.lowerPlural} to another stage</span>
              </div>
              {mode === "move" && (
                <div className="mt-3 pl-6" onClick={(e) => e.stopPropagation()}>
                  <Select value={target} onValueChange={setTarget}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select a stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {otherStages.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Delete option */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setMode("delete")}
              className={cn(
                "w-full cursor-pointer rounded-lg border p-3 transition-colors",
                mode === "delete" ? "border-destructive bg-destructive/5" : "hover:bg-accent/30",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full border",
                    mode === "delete" ? "border-destructive" : "border-muted-foreground/40",
                  )}
                >
                  {mode === "delete" && <span className="h-2 w-2 rounded-full bg-destructive" />}
                </span>
                <span className="text-sm font-medium">
                  Delete {count} {count === 1 ? noun.lower : noun.lowerPlural} permanently
                </span>
              </div>
              <p className="mt-1 pl-6 text-xs text-muted-foreground">
                Can’t be undone — their notes and reminders are deleted too.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={del.isPending}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={confirm}
            disabled={del.isPending}
          >
            {del.isPending
              ? "Working…"
              : empty
                ? "Delete stage"
                : mode === "move"
                  ? "Move & delete stage"
                  : `Delete ${noun.lowerPlural} & stage`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

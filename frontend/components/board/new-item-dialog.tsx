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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateItem } from "@/hooks/use-items";
import { ApiError } from "@/lib/api";
import { sortedStages } from "@/lib/board-utils";
import type { Board, Priority } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const todayISO = () => new Date().toISOString().slice(0, 10);

export function NewItemDialog({
  board,
  open,
  onOpenChange,
  defaultStageId,
}: {
  board: Board;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultStageId?: string;
}) {
  const stages = sortedStages(board);
  const create = useCreateItem();

  const [title, setTitle] = useState("");
  const [stageId, setStageId] = useState(defaultStageId || stages[0]?.id || "");
  const [date, setDate] = useState(todayISO());
  const [priority, setPriority] = useState<Priority>("medium");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setStageId(defaultStageId || stages[0]?.id || "");
      setDate(todayISO());
      setPriority("medium");
      setFields({});
      setTags("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultStageId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Company is required");
      return;
    }
    const fieldValues: Record<string, unknown> = {};
    for (const f of board.customFields) {
      const v = fields[f.id];
      if (v != null && v !== "") fieldValues[f.id] = v;
    }
    try {
      await create.mutateAsync({
        boardId: board._id,
        title: title.trim(),
        stageId,
        primaryDate: new Date(date).toISOString(),
        priority,
        fields: fieldValues,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      toast.success("Application added");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add application");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New application</DialogTitle>
          <DialogDescription>Add a role you&apos;re tracking.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Acme Inc."
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select value={stageId} onValueChange={setStageId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Applied date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {board.customFields.map((f) => (
              <div key={f.id} className={cn("space-y-2", f.type === "url" && "col-span-2")}>
                <Label>{f.name}</Label>
                {f.type === "select" && f.options ? (
                  <Select
                    value={fields[f.id] ?? ""}
                    onValueChange={(v) => setFields((p) => ({ ...p, [f.id]: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    value={fields[f.id] ?? ""}
                    onChange={(e) => setFields((p) => ({ ...p, [f.id]: e.target.value }))}
                    placeholder={f.type === "url" ? "https://…" : ""}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="remote, dream-job"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Adding…" : "Add application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

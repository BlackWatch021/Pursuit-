"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useActivities, useAddNote } from "@/hooks/use-activities";
import { useDeleteItem, useItem, useMoveItem, useUpdateItem } from "@/hooks/use-items";
import {
  useCreateReminder,
  useDeleteReminder,
  useItemReminders,
  useUpdateReminder,
} from "@/hooks/use-reminders";
import { sortedStages, stageMap } from "@/lib/board-utils";
import { fmtDate, fmtRelative, isOverdue } from "@/lib/format";
import type { Activity, Board, Priority } from "@/lib/types";
import { ArrowRight, Bell, Plus, Sparkles, StickyNote, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function ItemDetailSheet({
  itemId,
  board,
  open,
  onOpenChange,
}: {
  itemId: string | null;
  board: Board;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { data, isLoading } = useItem(itemId);
  const item = data?.item;
  const update = useUpdateItem();
  const move = useMoveItem();
  const del = useDeleteItem();

  const stages = sortedStages(board);
  const stageNames = stageMap(board);

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [fieldVals, setFieldVals] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setTags(item.tags.join(", "));
      const fv: Record<string, string> = {};
      for (const f of board.customFields) {
        const v = item.fields?.[f.id];
        fv[f.id] = v == null ? "" : String(v);
      }
      setFieldVals(fv);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?._id]);

  function saveTitle() {
    if (item && title.trim() && title.trim() !== item.title) {
      update.mutate({ id: item._id, data: { title: title.trim() } });
    }
  }
  function saveTags() {
    if (!item) return;
    const next = tags.split(",").map((t) => t.trim()).filter(Boolean);
    update.mutate({ id: item._id, data: { tags: next } });
  }
  function saveField(fieldId: string) {
    if (item) update.mutate({ id: item._id, data: { fields: { [fieldId]: fieldVals[fieldId] } } });
  }
  async function onDelete() {
    if (!item) return;
    await del.mutateAsync(item._id);
    toast.success("Application deleted");
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        {isLoading || !item ? (
          <div className="space-y-4 p-6">
            <SheetTitle className="sr-only">Application details</SheetTitle>
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="space-y-3 border-b p-5">
              <SheetTitle asChild>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={saveTitle}
                  className="w-full bg-transparent text-xl font-semibold tracking-tight outline-none focus:border-b focus:border-border"
                />
              </SheetTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={item.stageId} onValueChange={(v) => move.mutate({ id: item._id, stageId: v })}>
                  <SelectTrigger className="h-8 w-auto gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: stageNames.get(item.stageId)?.color }}
                    />
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

                <Select
                  value={item.priority}
                  onValueChange={(v) => update.mutate({ id: item._id, data: { priority: v as Priority } })}
                >
                  <SelectTrigger className="h-8 w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low priority</SelectItem>
                    <SelectItem value="medium">Medium priority</SelectItem>
                    <SelectItem value="high">High priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Body */}
            <Tabs defaultValue="details" className="flex min-h-0 flex-1 flex-col">
              <TabsList className="mx-5 mt-3 grid w-auto grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="reminders">Reminders</TabsTrigger>
              </TabsList>

              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-5">
                <TabsContent value="details" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Applied date</Label>
                    <Input
                      type="date"
                      defaultValue={new Date(item.primaryDate).toISOString().slice(0, 10)}
                      onChange={(e) =>
                        update.mutate({
                          id: item._id,
                          data: { primaryDate: new Date(e.target.value).toISOString() },
                        })
                      }
                      className="h-9"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {board.customFields.map((f) => (
                      <div key={f.id} className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{f.name}</Label>
                        {f.type === "select" && f.options ? (
                          <Select
                            value={fieldVals[f.id] || ""}
                            onValueChange={(v) => {
                              setFieldVals((p) => ({ ...p, [f.id]: v }));
                              update.mutate({ id: item._id, data: { fields: { [f.id]: v } } });
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="—" />
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
                            className="h-9"
                            type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                            value={fieldVals[f.id] ?? ""}
                            onChange={(e) => setFieldVals((p) => ({ ...p, [f.id]: e.target.value }))}
                            onBlur={() => saveField(f.id)}
                            placeholder="—"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Tags</Label>
                    <Input
                      className="h-9"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      onBlur={saveTags}
                      placeholder="comma, separated"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-0">
                  <ActivityTab itemId={item._id} board={board} />
                </TabsContent>

                <TabsContent value="reminders" className="mt-0">
                  <RemindersTab itemId={item._id} />
                </TabsContent>
              </div>
            </Tabs>

            {/* Footer */}
            <div className="flex items-center justify-between border-t p-4 text-xs text-muted-foreground">
              <span>Added {fmtDate(item.createdAt)}</span>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ActivityRow({ a, board }: { a: Activity; board: Board }) {
  const stages = stageMap(board);
  const time = fmtRelative(a.createdAt);

  if (a.type === "note") {
    return (
      <li className="flex gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <StickyNote className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="rounded-lg border bg-card p-3 text-sm">{a.content}</div>
          <p className="mt-1 text-xs text-muted-foreground">{time}</p>
        </div>
      </li>
    );
  }

  if (a.type === "stage_change") {
    const to = a.toStageId ? stages.get(a.toStageId) : undefined;
    const from = a.fromStageId ? stages.get(a.fromStageId) : undefined;
    return (
      <li className="flex gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1 pt-1 text-sm">
          <span className="text-muted-foreground">Moved </span>
          {from && <span className="font-medium">{from.name}</span>}
          <span className="text-muted-foreground"> → </span>
          <span className="font-medium">{to?.name ?? "?"}</span>
          <p className="mt-0.5 text-xs text-muted-foreground">{time}</p>
        </div>
      </li>
    );
  }

  // created
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1 pt-1 text-sm">
        <span className="text-muted-foreground">Application created</span>
        <p className="mt-0.5 text-xs text-muted-foreground">{time}</p>
      </div>
    </li>
  );
}

function ActivityTab({ itemId, board }: { itemId: string; board: Board }) {
  const { data, isLoading } = useActivities(itemId);
  const addNote = useAddNote(itemId);
  const [note, setNote] = useState("");

  async function submit() {
    if (!note.trim()) return;
    await addNote.mutateAsync(note.trim());
    setNote("");
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add an update — recruiter reply, interview notes, a link…"
          rows={3}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={submit} disabled={addNote.isPending || !note.trim()}>
            Add note
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <ul className="space-y-4">
          {data?.activities.map((a) => (
            <ActivityRow key={a._id} a={a} board={board} />
          ))}
        </ul>
      )}
    </div>
  );
}

function RemindersTab({ itemId }: { itemId: string }) {
  const { data, isLoading } = useItemReminders(itemId);
  const create = useCreateReminder();
  const updateR = useUpdateReminder();
  const delR = useDeleteReminder();
  const [due, setDue] = useState("");
  const [note, setNote] = useState("");

  async function add() {
    if (!due) {
      toast.error("Pick a due date");
      return;
    }
    await create.mutateAsync({ itemId, dueDate: new Date(due).toISOString(), note });
    setDue("");
    setNote("");
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border p-3">
        <div className="flex gap-2">
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="h-9" />
          <Button size="sm" onClick={add} disabled={create.isPending}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Follow up if no reply…"
          className="h-9"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : data && data.reminders.length > 0 ? (
        <ul className="space-y-2">
          {data.reminders.map((r) => (
            <li key={r._id} className="flex items-center gap-3 rounded-lg border p-3">
              <input
                type="checkbox"
                checked={r.done}
                onChange={(e) => updateR.mutate({ id: r._id, data: { done: e.target.checked } })}
                className="h-4 w-4 accent-primary"
              />
              <div className="min-w-0 flex-1">
                <p className={r.done ? "text-sm text-muted-foreground line-through" : "text-sm"}>
                  {r.note || "Follow up"}
                </p>
                <p
                  className={
                    !r.done && isOverdue(r.dueDate)
                      ? "text-xs font-medium text-destructive"
                      : "text-xs text-muted-foreground"
                  }
                >
                  {fmtDate(r.dueDate)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={() => delR.mutate(r._id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
          <Bell className="h-5 w-5" />
          No reminders yet.
        </div>
      )}
    </div>
  );
}

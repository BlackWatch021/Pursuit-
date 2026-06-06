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
import { MultiSelect } from "@/components/multi-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useActivities, useAddNote } from "@/hooks/use-activities";
import {
  UpdateItemData,
  useDeleteItem,
  useItem,
  useMoveItem,
  useUpdateItem,
} from "@/hooks/use-items";
import {
  useCreateReminder,
  useDeleteReminder,
  useItemReminders,
  useUpdateReminder,
} from "@/hooks/use-reminders";
import { itemNoun, sortedStages, stageMap } from "@/lib/board-utils";
import { dateOnlyToISO, fmtDate, fmtRelative, isOverdue } from "@/lib/format";
import type { Activity, Board, Item, Priority } from "@/lib/types";
import { ArrowRight, Bell, Pencil, Plus, Sparkles, StickyNote, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// Backend stores dates as ISO strings; extract YYYY-MM-DD without going
// through `new Date` so we never touch local time.
const isoDateOnly = (d: string) => d.slice(0, 10);

// A custom-field value is a string for most types, or a string[] for multiselect.
type FieldVal = string | string[];

// Equality that handles both string and array field values.
function sameVal(a: FieldVal | undefined, b: FieldVal | undefined): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    return JSON.stringify(a ?? []) === JSON.stringify(b ?? []);
  }
  return (a ?? "") === (b ?? "");
}

interface FormState {
  title: string;
  stageId: string;
  priority: Priority;
  primaryDate: string;
  tags: string;
  fieldVals: Record<string, FieldVal>;
}

function formStateFor(item: Item, board: Board): FormState {
  const fieldVals: Record<string, FieldVal> = {};
  for (const f of board.customFields) {
    const v = item.fields?.[f.id];
    if (f.type === "multiselect") {
      fieldVals[f.id] = Array.isArray(v) ? v.map(String) : v == null || v === "" ? [] : [String(v)];
    } else {
      fieldVals[f.id] = v == null ? "" : String(v);
    }
  }
  return {
    title: item.title,
    stageId: item.stageId,
    priority: item.priority,
    primaryDate: isoDateOnly(item.primaryDate),
    tags: item.tags.join(", "),
    fieldVals,
  };
}

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
  const freshItem = data?.item;
  // Cache the last loaded item so the drawer doesn't flash a blue skeleton
  // during its close animation (when itemId becomes null and the fetch stops).
  const [item, setItem] = useState<Item | null>(null);
  useEffect(() => {
    if (freshItem) setItem(freshItem);
  }, [freshItem]);
  useEffect(() => {
    // Switching to a different item: clear the cache so the new one loads fresh.
    if (open && itemId && item && item._id !== itemId) setItem(null);
  }, [open, itemId, item]);
  const update = useUpdateItem();
  const move = useMoveItem();
  const del = useDeleteItem();

  const stages = sortedStages(board);
  const stageNames = stageMap(board);
  const noun = itemNoun(board);

  const [form, setForm] = useState<FormState>({
    title: "",
    stageId: "",
    priority: "medium",
    primaryDate: "",
    tags: "",
    fieldVals: {},
  });

  // Reset the form whenever the loaded item changes (different card, or saved
  // updates streamed back from the server).
  useEffect(() => {
    if (item) setForm(formStateFor(item, board));
  }, [item, board]);

  const isDirty = useMemo(() => {
    if (!item) return false;
    const baseline = formStateFor(item, board);
    if (form.title.trim() !== baseline.title) return true;
    if (form.stageId !== baseline.stageId) return true;
    if (form.priority !== baseline.priority) return true;
    if (form.primaryDate !== baseline.primaryDate) return true;
    if (form.tags !== baseline.tags) return true;
    for (const f of board.customFields) {
      if (!sameVal(form.fieldVals[f.id], baseline.fieldVals[f.id])) return true;
    }
    return false;
  }, [item, board, form]);

  async function saveAll() {
    if (!item || !isDirty) return;
    const baseline = formStateFor(item, board);
    const data: UpdateItemData = {};

    if (form.title.trim() && form.title.trim() !== baseline.title) data.title = form.title.trim();
    if (form.priority !== baseline.priority) data.priority = form.priority;
    if (form.primaryDate !== baseline.primaryDate) {
      data.primaryDate = dateOnlyToISO(form.primaryDate);
    }
    if (form.tags !== baseline.tags) {
      data.tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    }
    const changedFields: Record<string, unknown> = {};
    for (const f of board.customFields) {
      const localV = form.fieldVals[f.id];
      const baseV = baseline.fieldVals[f.id];
      if (!sameVal(localV, baseV)) {
        changedFields[f.id] = localV ?? (f.type === "multiselect" ? [] : "");
      }
    }
    if (Object.keys(changedFields).length > 0) data.fields = changedFields;

    const stageChanged = form.stageId !== baseline.stageId;

    try {
      // Stage goes through the dedicated move endpoint so the timeline still
      // logs a stage_change; everything else is a single item update.
      if (Object.keys(data).length > 0) await update.mutateAsync({ id: item._id, data });
      if (stageChanged) await move.mutateAsync({ id: item._id, stageId: form.stageId });
      toast.success("Changes saved");
      onOpenChange(false);
    } catch {
      toast.error("Couldn't save changes");
    }
  }

  function discardChanges() {
    if (item) setForm(formStateFor(item, board));
  }

  async function onDelete() {
    if (!item) return;
    await del.mutateAsync(item._id);
    toast.success(`${noun.singular} deleted`);
    onOpenChange(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next && isDirty) {
      const ok = window.confirm("You have unsaved changes. Discard them?");
      if (!ok) return;
    }
    onOpenChange(next);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        {!item ? (
          // Only show skeletons during a genuine fresh open. When the drawer
          // is closing (open=false) we render just the a11y title to keep the
          // exit animation clean — no blue skeleton flash.
          isLoading && open ? (
            <div className="space-y-4 p-6">
              <SheetTitle className="sr-only">{noun.singular} details</SheetTitle>
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <SheetTitle className="sr-only">{noun.singular} details</SheetTitle>
          )
        ) : (
          <>
            {/* Header */}
            <div className="space-y-3 border-b p-5">
              <SheetTitle asChild>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full bg-transparent text-xl font-semibold tracking-tight outline-none focus:border-b focus:border-border"
                />
              </SheetTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={form.stageId}
                  onValueChange={(v) => setForm((p) => ({ ...p, stageId: v }))}
                >
                  <SelectTrigger className="h-8 w-auto gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: stageNames.get(form.stageId)?.color }}
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

                {board.showPriority && (
                  <Select
                    value={form.priority}
                    onValueChange={(v) => setForm((p) => ({ ...p, priority: v as Priority }))}
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
                )}
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
                    <Label className="text-xs text-muted-foreground">{board.dateLabel}</Label>
                    <Input
                      type="date"
                      value={form.primaryDate}
                      onChange={(e) => setForm((p) => ({ ...p, primaryDate: e.target.value }))}
                      className="h-9"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {board.customFields.map((f) => {
                      const opts = (f.options ?? []).filter(Boolean);
                      const cur = form.fieldVals[f.id];
                      return (
                        <div key={f.id} className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">{f.name}</Label>
                          {f.type === "select" ? (
                            <Select
                              value={(cur as string) || ""}
                              onValueChange={(v) =>
                                setForm((p) => ({ ...p, fieldVals: { ...p.fieldVals, [f.id]: v } }))
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder={opts.length ? "—" : "Add options in Settings"} />
                              </SelectTrigger>
                              <SelectContent>
                                {opts.map((o) => (
                                  <SelectItem key={o} value={o}>
                                    {o}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : f.type === "multiselect" ? (
                            <MultiSelect
                              options={opts}
                              value={Array.isArray(cur) ? cur : []}
                              onChange={(next) =>
                                setForm((p) => ({ ...p, fieldVals: { ...p.fieldVals, [f.id]: next } }))
                              }
                              placeholder="—"
                            />
                          ) : (
                            <Input
                              className="h-9"
                              type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                              value={(cur as string) ?? ""}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  fieldVals: { ...p.fieldVals, [f.id]: e.target.value },
                                }))
                              }
                              placeholder="—"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {board.showTags && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Tags</Label>
                      <Input
                        className="h-9"
                        value={form.tags}
                        onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                        placeholder="comma, separated"
                      />
                    </div>
                  )}
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
            <div className="flex items-center justify-between gap-3 border-t bg-card/80 p-4 backdrop-blur">
              {isDirty ? (
                <>
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    Unsaved changes
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={discardChanges}
                      disabled={update.isPending || move.isPending}
                    >
                      Discard
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveAll}
                      disabled={update.isPending || move.isPending}
                    >
                      {update.isPending || move.isPending ? "Saving…" : "Save changes"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground">
                    Added {fmtDate(item.createdAt)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ActivityRow({ a, board }: { a: Activity; board: Board }) {
  const stages = stageMap(board);
  const noun = itemNoun(board);
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

  if (a.type === "field_change") {
    const meta = (a.meta ?? {}) as { label?: string; from?: string; to?: string };
    return (
      <li className="flex gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Pencil className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1 pt-1 text-sm">
          <span className="font-medium">{meta.label ?? "Field"}</span>
          <span className="text-muted-foreground"> changed </span>
          <span className="text-muted-foreground">from </span>
          <span>{meta.from || "—"}</span>
          <span className="text-muted-foreground"> to </span>
          <span>{meta.to || "—"}</span>
          <p className="mt-0.5 text-xs text-muted-foreground">{time}</p>
        </div>
      </li>
    );
  }

  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1 pt-1 text-sm">
        <span className="text-muted-foreground">{noun.singular} created</span>
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
    await create.mutateAsync({ itemId, dueDate: dateOnlyToISO(due), note });
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

"use client";

import { PageHeader } from "@/components/app/page-header";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DeleteStageDialog } from "@/components/settings/delete-stage-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useBoards, useUpdateBoard } from "@/hooks/use-boards";
import { useItems } from "@/hooks/use-items";
import { FIELD_TYPE_VALUES } from "@/lib/constants";
import type { Board, CustomField, FieldType, Stage } from "@/lib/types";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function ProfileSection() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="max-w-md space-y-4 rounded-xl border bg-card p-5">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input value={user.name} readOnly />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={user.email} readOnly />
      </div>
      <p className="text-xs text-muted-foreground">Profile editing is coming soon.</p>
    </div>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const options = ["light", "dark", "system"] as const;
  return (
    <div className="max-w-md space-y-3 rounded-xl border bg-card p-5">
      <Label>Theme</Label>
      <div className="inline-flex rounded-lg border p-0.5">
        {options.map((o) => (
          <Button
            key={o}
            variant={theme === o ? "secondary" : "ghost"}
            size="sm"
            className="h-8 capitalize"
            onClick={() => setTheme(o)}
          >
            {o}
          </Button>
        ))}
      </div>
    </div>
  );
}

function BoardSection({ board }: { board: Board }) {
  const update = useUpdateBoard(board._id);
  const [stages, setStages] = useState<Stage[]>(board.stages.map((s) => ({ ...s })));
  const [fields, setFields] = useState<CustomField[]>(board.customFields.map((f) => ({ ...f })));

  useEffect(() => {
    setStages(board.stages.map((s) => ({ ...s })));
    setFields(board.customFields.map((f) => ({ ...f })));
  }, [board]);

  const { data: itemsData } = useItems(board._id);
  const countByStage = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of itemsData?.items ?? []) m[it.stageId] = (m[it.stageId] ?? 0) + 1;
    return m;
  }, [itemsData]);
  const [deletingStage, setDeletingStage] = useState<Stage | null>(null);
  const [deletingField, setDeletingField] = useState<CustomField | null>(null);

  // Only enable Save when the local edits actually differ from the saved board.
  const stagesDirty = useMemo(() => {
    if (stages.length !== board.stages.length) return true;
    return stages.some((s, i) => {
      const b = board.stages[i];
      return !b || s.id !== b.id || s.name !== b.name || s.color !== b.color;
    });
  }, [stages, board.stages]);

  const fieldsDirty = useMemo(() => {
    if (fields.length !== board.customFields.length) return true;
    return fields.some((f, i) => {
      const b = board.customFields[i];
      if (!b || f.id !== b.id || f.name !== b.name || f.type !== b.type) return true;
      return (f.options ?? []).join("") !== (b.options ?? []).join("");
    });
  }, [fields, board.customFields]);

  function requestDeleteField(field: CustomField) {
    const persisted = board.customFields.some((x) => x.id === field.id);
    if (!persisted) {
      // Unsaved new field — just drop it locally, no confirmation needed.
      setFields((p) => p.filter((x) => x.id !== field.id));
      return;
    }
    setDeletingField(field);
  }

  function requestDeleteStage(stage: Stage) {
    const persisted = board.stages.some((s) => s.id === stage.id);
    if (!persisted) {
      // A brand-new stage that hasn't been saved yet — just drop it locally.
      setStages((p) => p.filter((x) => x.id !== stage.id));
      return;
    }
    if (board.stages.length <= 1) {
      toast.error("A board needs at least one stage");
      return;
    }
    setDeletingStage(stage);
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= stages.length) return;
    const next = [...stages];
    [next[i], next[j]] = [next[j], next[i]];
    setStages(next);
  }

  function saveStages() {
    update.mutate(
      { stages: stages.map((s, i) => ({ ...s, order: i })) },
      { onSuccess: () => toast.success("Stages saved") },
    );
  }
  function saveFields() {
    update.mutate({ customFields: fields }, { onSuccess: () => toast.success("Fields saved") });
  }

  return (
    <div className="space-y-6">
      {/* Stages */}
      <div className="space-y-3 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium">Stages</h2>
            <p className="text-xs text-muted-foreground">The columns on your board.</p>
          </div>
          <Button size="sm" onClick={saveStages} disabled={update.isPending || !stagesDirty}>
            Save
          </Button>
        </div>
        <div className="space-y-2">
          {stages.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <input
                type="color"
                value={s.color}
                onChange={(e) =>
                  setStages((p) => p.map((x) => (x.id === s.id ? { ...x, color: e.target.value } : x)))
                }
                className="h-8 w-8 cursor-pointer rounded border bg-transparent"
                aria-label="Stage color"
              />
              <Input
                value={s.name}
                onChange={(e) =>
                  setStages((p) => p.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)))
                }
                className="h-9"
              />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(i, -1)}>
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(i, 1)}>
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => requestDeleteStage(s)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setStages((p) => [
              ...p,
              { id: crypto.randomUUID(), name: "New stage", order: p.length, color: "#6366f1" },
            ])
          }
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add stage
        </Button>
      </div>

      {/* Custom fields */}
      <div className="space-y-3 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium">Custom fields</h2>
            <p className="text-xs text-muted-foreground">Extra details tracked per application.</p>
          </div>
          <Button size="sm" onClick={saveFields} disabled={update.isPending || !fieldsDirty}>
            Save
          </Button>
        </div>
        <div className="space-y-2">
          {fields.map((f) => (
            <div key={f.id} className="flex items-center gap-2">
              <Input
                value={f.name}
                onChange={(e) =>
                  setFields((p) => p.map((x) => (x.id === f.id ? { ...x, name: e.target.value } : x)))
                }
                className="h-9 flex-1"
              />
              <Select
                value={f.type}
                onValueChange={(v) =>
                  setFields((p) => p.map((x) => (x.id === f.id ? { ...x, type: v as FieldType } : x)))
                }
              >
                <SelectTrigger className="h-9 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPE_VALUES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => requestDeleteField(f)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setFields((p) => [...p, { id: crypto.randomUUID(), name: "New field", type: "text" }])
          }
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add field
        </Button>
      </div>

      <DeleteStageDialog
        board={board}
        stage={deletingStage}
        count={deletingStage ? (countByStage[deletingStage.id] ?? 0) : 0}
        open={!!deletingStage}
        onOpenChange={(o) => {
          if (!o) setDeletingStage(null);
        }}
      />

      <ConfirmDialog
        open={!!deletingField}
        onOpenChange={(o) => {
          if (!o) setDeletingField(null);
        }}
        title={deletingField ? `Delete “${deletingField.name}”?` : "Delete field"}
        description="This field is removed from your board. Saved values stay in the database but are hidden from your applications — click Save to apply."
        confirmLabel="Remove field"
        destructive
        onConfirm={() => {
          if (deletingField) setFields((p) => p.filter((x) => x.id !== deletingField.id));
        }}
      />
    </div>
  );
}

export default function SettingsPage() {
  const { data } = useBoards();
  const board = data?.boards[0];

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Settings" description="Manage your account and board." />
      <div className="p-4 sm:p-6">
        <Tabs defaultValue="board" className="max-w-3xl">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="mt-4">
            <ProfileSection />
          </TabsContent>
          <TabsContent value="board" className="mt-4">
            {board ? <BoardSection board={board} /> : <Skeleton className="h-64 rounded-xl" />}
          </TabsContent>
          <TabsContent value="appearance" className="mt-4">
            <AppearanceSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

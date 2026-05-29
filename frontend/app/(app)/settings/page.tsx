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
import { useAuth } from "@/hooks/use-auth";
import { useBoards, useUpdateBoard } from "@/hooks/use-boards";
import { FIELD_TYPE_VALUES } from "@/lib/constants";
import type { Board, CustomField, FieldType, Stage } from "@/lib/types";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
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
          <Button size="sm" onClick={saveStages} disabled={update.isPending}>
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
                onClick={() => setStages((p) => p.filter((x) => x.id !== s.id))}
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
          <Button size="sm" onClick={saveFields} disabled={update.isPending}>
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
                onClick={() => setFields((p) => p.filter((x) => x.id !== f.id))}
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

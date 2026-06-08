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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useActiveBoard } from "@/components/board-provider";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DeleteStageDialog } from "@/components/settings/delete-stage-dialog";
import {
  useAuth,
  useUpdateEmail,
  useUpdatePassword,
  useUpdateProfile,
} from "@/hooks/use-auth";
import { useDeleteBoard, useUpdateBoard } from "@/hooks/use-boards";
import { useItems } from "@/hooks/use-items";
import { ApiError } from "@/lib/api";
import { itemNoun } from "@/lib/board-utils";
import { FIELD_TYPE_LABELS, FIELD_TYPE_VALUES } from "@/lib/constants";
import type { Board, CustomField, FieldType, Stage, User } from "@/lib/types";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ProfileSection() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const updateEmail = useUpdateEmail();
  const updatePassword = useUpdatePassword();

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  // Sync the editable fields from the loaded user at render time (not in an
  // effect — see MEMORY §12). Re-runs when the cached user object changes,
  // e.g. after a successful save.
  const [synced, setSynced] = useState<User | null>(null);
  if (user && user !== synced) {
    setSynced(user);
    setName(user.name);
    setImage(user.image ?? "");
    setEmail(user.email);
  }

  if (!user) return null;

  const profileDirty =
    name.trim() !== user.name || image.trim() !== (user.image ?? "");
  const emailDirty = email.trim().toLowerCase() !== user.email;

  function saveProfile() {
    if (!name.trim()) {
      toast.error("Name can't be empty");
      return;
    }
    updateProfile.mutate(
      { name: name.trim(), image: image.trim() },
      {
        onSuccess: () => toast.success("Profile updated"),
        onError: (e) =>
          toast.error(
            e instanceof ApiError ? e.message : "Couldn't update profile",
          ),
      },
    );
  }

  function saveEmail() {
    updateEmail.mutate(
      { email: email.trim(), currentPassword: emailPassword },
      {
        onSuccess: () => {
          toast.success("Email updated");
          setEmailPassword("");
        },
        onError: (e) =>
          toast.error(
            e instanceof ApiError ? e.message : "Couldn't update email",
          ),
      },
    );
  }

  function savePassword() {
    if (newPw.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("New passwords don't match");
      return;
    }
    updatePassword.mutate(
      { currentPassword: curPw, newPassword: newPw },
      {
        onSuccess: () => {
          toast.success("Password changed");
          setCurPw("");
          setNewPw("");
          setConfirmPw("");
        },
        onError: (e) =>
          toast.error(
            e instanceof ApiError ? e.message : "Couldn't change password",
          ),
      },
    );
  }

  return (
    <div className="max-w-md space-y-6">
      {/* Profile */}
      <div className="space-y-4 rounded-xl border bg-card p-5">
        <div className="flex items-center gap-3">
          <Avatar size="lg" className="h-12 w-12">
            {image.trim() && <AvatarImage src={image.trim()} alt={name} />}
            <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
              {initialsOf(name || user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name || user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Avatar URL</Label>
          <Input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://…"
          />
          <p className="text-xs text-muted-foreground">
            Paste an image link. File upload is coming later.
          </p>
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={saveProfile}
            disabled={updateProfile.isPending || !profileDirty}
          >
            Save
          </Button>
        </div>
      </div>

      {/* Email */}
      <div className="space-y-4 rounded-xl border bg-card p-5">
        <div>
          <h2 className="text-sm font-medium">Email</h2>
          <p className="text-xs text-muted-foreground">
            Changing your email needs your current password.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Email address</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Current password</Label>
          <Input
            type="password"
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={saveEmail}
            disabled={updateEmail.isPending || !emailDirty || !emailPassword}
          >
            Update email
          </Button>
        </div>
      </div>

      {/* Password */}
      <div className="space-y-4 rounded-xl border bg-card p-5">
        <div>
          <h2 className="text-sm font-medium">Password</h2>
          <p className="text-xs text-muted-foreground">
            Use at least 6 characters.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Current password</Label>
          <Input
            type="password"
            value={curPw}
            onChange={(e) => setCurPw(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>New password</Label>
            <Input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Confirm new</Label>
            <Input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={savePassword}
            disabled={
              updatePassword.isPending || !curPw || !newPw || !confirmPw
            }
          >
            Change password
          </Button>
        </div>
      </div>
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

/** The board's chosen final stage, or the last stage by order when unset/stale. */
function effectiveFinalStage(board: Board): string {
  const ordered = [...board.stages].sort((a, b) => a.order - b.order);
  const last = ordered[ordered.length - 1]?.id ?? "";
  return ordered.some((s) => s.id === board.finalStageId)
    ? (board.finalStageId as string)
    : last;
}

function BoardSection({ board }: { board: Board }) {
  const update = useUpdateBoard(board._id);
  const deleteBoard = useDeleteBoard();
  const { boards, setActiveBoardId } = useActiveBoard();
  const [name, setName] = useState(board.name);
  const [color, setColor] = useState(board.color);
  const [titleLabel, setTitleLabel] = useState(board.titleLabel);
  const [dateLabel, setDateLabel] = useState(board.dateLabel);
  const [itemLabel, setItemLabel] = useState(board.itemLabel);
  const [showTags, setShowTags] = useState(board.showTags);
  const [showPriority, setShowPriority] = useState(board.showPriority);
  const [finalStageId, setFinalStageId] = useState(() =>
    effectiveFinalStage(board),
  );
  const [stages, setStages] = useState<Stage[]>(
    board.stages.map((s) => ({ ...s })),
  );
  const [fields, setFields] = useState<CustomField[]>(
    board.customFields.map((f) => ({ ...f })),
  );
  const [deletingBoard, setDeletingBoard] = useState(false);

  // Re-sync local edits when the saved board object changes (after a save, a
  // stage delete, or switching boards). Render-time guard, not an effect —
  // see MEMORY §12. react-query's structural sharing keeps the reference
  // stable unless the data actually changed, so this only fires on real updates.
  const [synced, setSynced] = useState(board);
  if (synced !== board) {
    setSynced(board);
    setName(board.name);
    setColor(board.color);
    setTitleLabel(board.titleLabel);
    setDateLabel(board.dateLabel);
    setItemLabel(board.itemLabel);
    setShowTags(board.showTags);
    setShowPriority(board.showPriority);
    setFinalStageId(effectiveFinalStage(board));
    setStages(board.stages.map((s) => ({ ...s })));
    setFields(board.customFields.map((f) => ({ ...f })));
  }

  const { data: itemsData } = useItems(board._id);
  const countByStage = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of itemsData?.items ?? [])
      m[it.stageId] = (m[it.stageId] ?? 0) + 1;
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
      if (!b || f.id !== b.id || f.name !== b.name || f.type !== b.type)
        return true;
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
    // Trim/drop empty options, and only keep an options list for choice fields.
    const cleaned = fields.map((f) => {
      const isChoice = f.type === "select" || f.type === "multiselect";
      return {
        ...f,
        options: isChoice
          ? (f.options ?? []).map((o) => o.trim()).filter(Boolean)
          : undefined,
      };
    });
    update.mutate(
      { customFields: cleaned },
      { onSuccess: () => toast.success("Fields saved") },
    );
  }

  const noun = itemNoun(board);
  const metaDirty =
    name !== board.name ||
    color !== board.color ||
    titleLabel !== board.titleLabel ||
    dateLabel !== board.dateLabel ||
    itemLabel !== board.itemLabel ||
    showTags !== board.showTags ||
    showPriority !== board.showPriority ||
    finalStageId !== effectiveFinalStage(board);

  return (
    <div className="space-y-6">
      {/* Board name + color + delete */}
      <div className="space-y-3 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium">Board</h2>
            <p className="text-xs text-muted-foreground">
              Name and color of this tracker.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() =>
              update.mutate(
                {
                  name: name.trim(),
                  color,
                  titleLabel: titleLabel.trim() || "Title",
                  dateLabel: dateLabel.trim() || "Date",
                  itemLabel: itemLabel.trim() || "Item",
                  showTags,
                  showPriority,
                  finalStageId,
                },
                { onSuccess: () => toast.success("Board saved") },
              )
            }
            disabled={update.isPending || !name.trim() || !metaDirty}
          >
            Save
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-9 w-9 shrink-0 cursor-pointer rounded border bg-transparent"
            aria-label="Board color"
          />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-1.5 border-t pt-3">
          <Label className="text-xs text-muted-foreground">
            What do you call each entry?
          </Label>
          <Input
            value={itemLabel}
            onChange={(e) => setItemLabel(e.target.value)}
            placeholder="Item"
            className="h-9"
          />
          <p className="text-xs text-muted-foreground">
            This word shows up in buttons and titles. Type{" "}
            <span className="italic">Application</span> and you&apos;ll see{" "}
            <span className="italic">&ldquo;New application&rdquo;</span>. Other
            examples: Book, Task, Lead.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Title field label
            </Label>
            <Input
              value={titleLabel}
              onChange={(e) => setTitleLabel(e.target.value)}
              placeholder="Title"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Date field label
            </Label>
            <Input
              value={dateLabel}
              onChange={(e) => setDateLabel(e.target.value)}
              placeholder="Date"
              className="h-9"
            />
          </div>
        </div>

        <div className="space-y-1.5 border-t pt-3">
          <Label className="text-xs text-muted-foreground">Final stage</Label>
          <Select value={finalStageId} onValueChange={setFinalStageId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Last stage" />
            </SelectTrigger>
            <SelectContent>
              {[...board.stages]
                .sort((a, b) => a.order - b.order)
                .map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {noun.plural} here count as done — drives the dashboard&apos;s
            Completion &amp; Active stats.
          </p>
        </div>

        <div className="flex items-start justify-between gap-3 border-t pt-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Tags</p>
            <p className="text-xs text-muted-foreground">
              Free-form labels to group and filter items.{" "}
              <span className="italic">e.g. remote, urgent, follow-up</span>
            </p>
          </div>
          <Switch checked={showTags} onCheckedChange={setShowTags} />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Priority</p>
            <p className="text-xs text-muted-foreground">
              Flag how important each item is, with sortable levels.{" "}
              <span className="italic">e.g. Low / Medium / High</span>
            </p>
          </div>
          <Switch checked={showPriority} onCheckedChange={setShowPriority} />
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <p className="text-xs text-muted-foreground">
            {boards.length <= 1
              ? "Your only board can't be deleted."
              : `Deleting a board removes all of its ${noun.lowerPlural}.`}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={boards.length <= 1 || deleteBoard.isPending}
            onClick={() => setDeletingBoard(true)}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete board
          </Button>
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-3 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium">Stages</h2>
            <p className="text-xs text-muted-foreground">
              The columns on your board.
            </p>
          </div>
          <Button
            size="sm"
            onClick={saveStages}
            disabled={update.isPending || !stagesDirty}
          >
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
                  setStages((p) =>
                    p.map((x) =>
                      x.id === s.id ? { ...x, color: e.target.value } : x,
                    ),
                  )
                }
                className="h-8 w-8 cursor-pointer rounded border bg-transparent"
                aria-label="Stage color"
              />
              <Input
                value={s.name}
                onChange={(e) =>
                  setStages((p) =>
                    p.map((x) =>
                      x.id === s.id ? { ...x, name: e.target.value } : x,
                    ),
                  )
                }
                className="h-9"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => move(i, -1)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => move(i, 1)}
              >
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
              {
                id: crypto.randomUUID(),
                name: "New stage",
                order: p.length,
                color: "#6366f1",
              },
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
            <p className="text-xs text-muted-foreground">
              Extra details tracked per {noun.lower}.
            </p>
          </div>
          <Button
            size="sm"
            onClick={saveFields}
            disabled={update.isPending || !fieldsDirty}
          >
            Save
          </Button>
        </div>
        <div className="space-y-2">
          {fields.map((f) => {
            const isChoice = f.type === "select" || f.type === "multiselect";
            return (
              <div key={f.id} className="space-y-2 rounded-lg border p-2.5">
                <div className="flex items-center gap-2">
                  <Input
                    value={f.name}
                    onChange={(e) =>
                      setFields((p) =>
                        p.map((x) =>
                          x.id === f.id ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                    className="h-9 flex-1"
                  />
                  <Select
                    value={f.type}
                    onValueChange={(v) =>
                      setFields((p) =>
                        p.map((x) =>
                          x.id === f.id ? { ...x, type: v as FieldType } : x,
                        ),
                      )
                    }
                  >
                    <SelectTrigger className="h-9 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPE_VALUES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {FIELD_TYPE_LABELS[t]}
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

                {isChoice && (
                  <div className="space-y-1 pl-1">
                    <Label className="text-xs text-muted-foreground">
                      Options (comma separated)
                    </Label>
                    <Input
                      value={(f.options ?? []).join(", ")}
                      onChange={(e) =>
                        setFields((p) =>
                          p.map((x) =>
                            x.id === f.id
                              ? {
                                  ...x,
                                  options: e.target.value
                                    .split(",")
                                    .map((o) => o.trimStart()),
                                }
                              : x,
                          ),
                        )
                      }
                      placeholder="e.g. Low, Medium, High"
                      className="h-9"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setFields((p) => [
              ...p,
              { id: crypto.randomUUID(), name: "New field", type: "text" },
            ])
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
        title={
          deletingField ? `Delete “${deletingField.name}”?` : "Delete field"
        }
        description={`This field is removed from your board. Saved values stay in the database but are hidden from your ${noun.lowerPlural} — click Save to apply.`}
        confirmLabel="Remove field"
        destructive
        onConfirm={() => {
          if (deletingField)
            setFields((p) => p.filter((x) => x.id !== deletingField.id));
        }}
      />

      <ConfirmDialog
        open={deletingBoard}
        onOpenChange={setDeletingBoard}
        title={`Delete “${board.name}”?`}
        description={`This permanently deletes the board and all of its ${noun.lowerPlural}, activity, and reminders. This can't be undone.`}
        confirmLabel="Delete board"
        destructive
        onConfirm={() => {
          deleteBoard.mutate(board._id, {
            onSuccess: () => {
              toast.success("Board deleted");
              const remaining = boards.filter((b) => b._id !== board._id);
              if (remaining[0]) setActiveBoardId(remaining[0]._id);
            },
          });
        }}
      />
    </div>
  );
}

export default function SettingsPage() {
  const { activeBoard: board } = useActiveBoard();

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Settings"
        description="Manage your account and boards."
      />
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
            {board ? (
              <BoardSection key={board._id} board={board} />
            ) : (
              <Skeleton className="h-64 rounded-xl" />
            )}
          </TabsContent>
          <TabsContent value="appearance" className="mt-4">
            <AppearanceSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import type { Board, CustomField, Item, Stage } from "@/lib/types";

export function sortedStages(board?: Board): Stage[] {
  return [...(board?.stages ?? [])].sort((a, b) => a.order - b.order);
}

export function stageMap(board?: Board): Map<string, Stage> {
  return new Map((board?.stages ?? []).map((s) => [s.id, s]));
}

export function fieldByName(board: Board | undefined, name: string): CustomField | undefined {
  return board?.customFields.find((f) => f.name.toLowerCase() === name.toLowerCase());
}

export function getField(item: Item, board: Board | undefined, name: string): string {
  const f = fieldByName(board, name);
  if (!f) return "";
  const v = item.fields?.[f.id];
  return v == null ? "" : String(v);
}

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export interface ItemNoun {
  singular: string; // "Application"
  plural: string; // "Applications"
  lower: string; // "application"
  lowerPlural: string; // "applications"
}

/** The per-board word for an item ("Application", "Book", "Task", …). */
export function itemNoun(board?: Pick<Board, "itemLabel"> | null): ItemNoun {
  const singular = (board?.itemLabel || "Item").trim() || "Item";
  const plural = `${singular}s`;
  return {
    singular,
    plural,
    lower: singular.toLowerCase(),
    lowerPlural: plural.toLowerCase(),
  };
}

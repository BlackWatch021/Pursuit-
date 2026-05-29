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

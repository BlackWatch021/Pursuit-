import { PRIORITY_LABELS, sortedStages, stageMap } from "@/lib/board-utils";
import { todayDateOnly } from "@/lib/format";
import type { Board, Item } from "@/lib/types";

/** Render a single field value to a flat string (arrays → "a; b; c"). */
function fieldToString(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(String).join("; ");
  return String(value);
}

/** The board's primary date, kept as a stored "YYYY-MM-DD" (no timezone drift). */
function dateOnly(iso: string): string {
  return typeof iso === "string" ? iso.slice(0, 10) : "";
}

export interface ExportTable {
  headers: string[];
  rows: string[][];
}

/**
 * Flatten a board's items into a header row + value rows, mirroring the columns
 * shown in the table view (title, stage, custom fields, date, priority, tags) and
 * honouring the board's showTags / showPriority toggles.
 */
export function buildExportTable(board: Board, items: Item[]): ExportTable {
  const stages = stageMap(board);

  const headers = [
    board.titleLabel || "Title",
    "Stage",
    ...board.customFields.map((f) => f.name),
    board.dateLabel || "Date",
  ];
  if (board.showPriority) headers.push("Priority");
  if (board.showTags) headers.push("Tags");

  const rows = items.map((it) => {
    const row = [
      it.title ?? "",
      stages.get(it.stageId)?.name ?? "",
      ...board.customFields.map((f) => fieldToString(it.fields?.[f.id])),
      dateOnly(it.primaryDate),
    ];
    if (board.showPriority) row.push(PRIORITY_LABELS[it.priority] ?? it.priority);
    if (board.showTags) row.push(it.tags.join("; "));
    return row;
  });

  return { headers, rows };
}

/** Sort items by stage order then title, so the export has a stable, sensible order. */
export function orderedForExport(board: Board, items: Item[]): Item[] {
  const order = new Map(sortedStages(board).map((s, i) => [s.id, i]));
  return [...items].sort((a, b) => {
    const sa = order.get(a.stageId) ?? 999;
    const sb = order.get(b.stageId) ?? 999;
    if (sa !== sb) return sa - sb;
    return a.title.localeCompare(b.title);
  });
}

/** `my-board-2026-06-08` — safe, dated base for the downloaded file. */
export function exportFileBase(board: Board): string {
  const slug =
    board.slug ||
    board.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") ||
    "board";
  return `${slug}-${todayDateOnly()}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Escape one CSV cell per RFC 4180 (quote when it holds a comma/quote/newline). */
function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Export the board's items as a UTF-8 CSV file (BOM-prefixed so Excel reads it right). */
export function exportBoardCsv(board: Board, items: Item[]) {
  const { headers, rows } = buildExportTable(board, orderedForExport(board, items));
  const lines = [headers, ...rows].map((cells) => cells.map(csvCell).join(","));
  const csv = "﻿" + lines.join("\r\n");
  triggerDownload(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
    `${exportFileBase(board)}.csv`,
  );
}

/** Export the board's items as a real .xlsx workbook (lazy-loads SheetJS). */
export async function exportBoardXlsx(board: Board, items: Item[]) {
  const XLSX = await import("xlsx");
  const { headers, rows } = buildExportTable(board, orderedForExport(board, items));
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  // Roughly size each column to its widest cell so the file opens readable.
  sheet["!cols"] = headers.map((h, i) => {
    const widest = Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length));
    return { wch: Math.min(Math.max(widest + 2, 10), 50) };
  });
  const wb = XLSX.utils.book_new();
  // Sheet names can't exceed 31 chars or contain []*?/\: — sanitise the board name.
  const sheetName = (board.name || "Sheet1").replace(/[[\]*?/\\:]/g, " ").slice(0, 31);
  XLSX.utils.book_append_sheet(wb, sheet, sheetName);
  XLSX.writeFile(wb, `${exportFileBase(board)}.xlsx`);
}

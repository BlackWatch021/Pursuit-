"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportBoardCsv, exportBoardXlsx } from "@/lib/export";
import type { Board, Item } from "@/lib/types";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/** "Export ▾" menu (CSV / Excel) for the current board's visible items. */
export function ExportMenu({ board, items }: { board: Board; items: Item[] }) {
  const [busy, setBusy] = useState(false);
  const disabled = items.length === 0;

  async function run(kind: "csv" | "xlsx") {
    if (disabled || busy) return;
    setBusy(true);
    try {
      if (kind === "csv") exportBoardCsv(board, items);
      else await exportBoardXlsx(board, items);
      toast.success(`Exported ${items.length} ${items.length === 1 ? "row" : "rows"}`);
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9" disabled={disabled || busy}>
          <Download className="mr-1.5 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => run("csv")}>
          <FileText className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run("xlsx")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

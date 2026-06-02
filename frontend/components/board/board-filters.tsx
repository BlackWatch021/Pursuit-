"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Priority } from "@/lib/types";
import { Check, ChevronDown, Flag, Search, Tag, X } from "lucide-react";

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

function CountBadge({ n }: { n: number }) {
  if (n === 0) return null;
  return <span className="ml-1.5 rounded bg-primary/15 px-1.5 text-xs text-primary">{n}</span>;
}

export function BoardFilters({
  search,
  onSearch,
  allTags,
  selectedTags,
  onToggleTag,
  selectedPriorities,
  onTogglePriority,
  onClear,
  activeCount,
}: {
  search: string;
  onSearch: (v: string) => void;
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (t: string) => void;
  selectedPriorities: Priority[];
  onTogglePriority: (p: Priority) => void;
  onClear: () => void;
  activeCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3 sm:px-6">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search…"
          className="h-9 w-40 pl-8 sm:w-56"
        />
      </div>

      {/* Tags */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <Tag className="mr-1.5 h-4 w-4" />
            Tags
            <CountBadge n={selectedTags.length} />
            <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-52 p-1">
          {allTags.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">No tags yet</p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => onToggleTag(t)}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <span className="truncate">{t}</span>
                  {selectedTags.includes(t) && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Priority */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <Flag className="mr-1.5 h-4 w-4" />
            Priority
            <CountBadge n={selectedPriorities.length} />
            <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-44 p-1">
          {PRIORITY_OPTIONS.map((p) => (
            <button
              key={p.value}
              onClick={() => onTogglePriority(p.value)}
              className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent"
            >
              <span>{p.label}</span>
              {selectedPriorities.includes(p.value) && (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              )}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-muted-foreground"
          onClick={onClear}
        >
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}

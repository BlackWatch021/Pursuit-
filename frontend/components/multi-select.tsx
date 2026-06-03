"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";

/** Pick-many control over a fixed option list, rendered as removable chips. */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  className,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  function toggle(o: string) {
    onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o]);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-auto min-h-9 w-full justify-between gap-2 px-3 py-1.5 font-normal",
            className,
          )}
        >
          <span className="flex flex-wrap gap-1">
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              value.map((v) => (
                <Badge key={v} variant="secondary" className="px-1.5 py-0 text-xs font-normal">
                  {v}
                </Badge>
              ))
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1">
        {options.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-muted-foreground">
            No options yet — add them in Settings.
          </p>
        ) : (
          <div className="max-h-56 overflow-y-auto">
            {options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => toggle(o)}
                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent"
              >
                <span className="truncate">{o}</span>
                {value.includes(o) && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

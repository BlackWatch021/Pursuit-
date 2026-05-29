import { cn } from "@/lib/utils";
import { Target } from "lucide-react";

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Target className="h-5 w-5" strokeWidth={2.5} />
      </div>
      {showWordmark && <span className="text-lg font-semibold tracking-tight">Pursuit</span>}
    </div>
  );
}

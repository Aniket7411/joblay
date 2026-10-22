"use client";

import { Heart } from "lucide-react";
import { useSavedJobs } from "@/hooks/useStoredList";
import { cn } from "@/lib/utils";

/** Heart toggle that saves a job in this browser (see /saved). */
export function SaveJobButton({
  jobId,
  withLabel = false,
  className,
}: {
  jobId: string;
  withLabel?: boolean;
  className?: string;
}) {
  const { list, toggle } = useSavedJobs();
  const saved = list.includes(jobId);
  return (
    <button
      type="button"
      onClick={() => toggle(jobId)}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved jobs" : "Save job"}
      title={saved ? "Saved" : "Save for later"}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border transition-colors",
        withLabel ? "h-9 px-3 text-sm font-medium" : "h-8 w-8",
        saved
          ? "border-saffron/40 bg-saffron/10 text-saffron-dark dark:text-saffron"
          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted",
        className
      )}
    >
      <Heart className={cn("h-4 w-4", saved && "fill-current")} />
      {withLabel && (saved ? "Saved" : "Save")}
    </button>
  );
}

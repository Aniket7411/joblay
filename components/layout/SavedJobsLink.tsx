"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useSavedJobs } from "@/hooks/useStoredList";
import { cn } from "@/lib/utils";

/** Navbar heart with the saved-jobs count. */
export function SavedJobsLink({ active }: { active: boolean }) {
  const { list } = useSavedJobs();
  return (
    <Link
      href="/saved"
      aria-label={`Saved jobs${list.length ? ` (${list.length})` : ""}`}
      title="Saved jobs"
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-xl border border-border transition-colors",
        active ? "text-saffron bg-saffron/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <Heart className={cn("h-4 w-4", list.length > 0 && "fill-saffron text-saffron")} />
      {list.length > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-5 rounded-full bg-saffron px-1 text-center text-[11px] font-semibold leading-5 text-white">
          {list.length > 99 ? "99+" : list.length}
        </span>
      )}
    </Link>
  );
}

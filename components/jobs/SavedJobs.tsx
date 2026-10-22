"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { JobCard } from "@/components/jobs/JobCard";
import { useSavedJobs } from "@/hooks/useStoredList";
import type { JobPosting } from "@/types";

/** The visitor's hearted jobs (ids live in this browser; details come fresh from the server). */
export function SavedJobs() {
  const { list: ids } = useSavedJobs();
  const [jobs, setJobs] = useState<JobPosting[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [now] = useState(() => Date.now());
  const idsKey = ids.join(",");

  useEffect(() => {
    if (!idsKey) return;
    let cancelled = false;
    fetch(`/api/jobs/saved?ids=${encodeURIComponent(idsKey)}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success) setJobs(json.data as JobPosting[]);
        else setFailed(true);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  // Un-hearting a job removes it at once, without refetching.
  const shown = (jobs ?? []).filter((j) => ids.includes(j.id));
  const gone = jobs ? ids.length - shown.length : 0;

  if (!ids.length) {
    return (
      <div className="text-center py-20 rounded-2xl border border-dashed border-border">
        <Heart className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-lg font-medium">No saved jobs yet</p>
        <p className="text-muted-foreground mt-2">Tap the heart on any job to keep it here for later.</p>
        <Link href="/">
          <Button className="mt-4">Browse jobs</Button>
        </Link>
      </div>
    );
  }
  if (failed) {
    return <p className="text-muted-foreground py-10 text-center">Couldn&apos;t load your saved jobs. Please refresh.</p>;
  }
  if (!jobs) {
    return (
      <p className="flex items-center justify-center gap-2 text-muted-foreground py-10">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading saved jobs...
      </p>
    );
  }
  return (
    <>
      {gone > 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          {gone} saved job{gone === 1 ? " is" : "s are"} no longer open and {gone === 1 ? "isn't" : "aren't"} shown.
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shown.map((job) => (
          <JobCard key={job.id} job={job} now={now} />
        ))}
      </div>
    </>
  );
}

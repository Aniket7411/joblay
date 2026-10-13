"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { JobCard } from "@/components/jobs/JobCard";
import { FilterBar } from "@/components/jobs/FilterBar";
import { JobHero } from "@/components/jobs/JobHero";
import { Button } from "@/components/ui/Button";
import { useDebounce } from "@/hooks/useDebounce";
import type { JobFilters, JobPosting } from "@/types";

const emptyFilters: JobFilters = {
  location: "",
  jobProfile: "",
  industry: "",
  subRole: "",
  tags: [],
  search: "",
};

function filterJobs(jobs: JobPosting[], filters: JobFilters): JobPosting[] {
  const q = filters.search.toLowerCase();

  return jobs.filter((job) => {
    if (filters.location && job.location !== filters.location) return false;
    if (filters.jobProfile && job.jobProfile !== filters.jobProfile) return false;
    if (filters.industry && job.industry !== filters.industry) return false;
    if (filters.subRole && job.subRole !== filters.subRole) return false;
    if (
      filters.tags.length > 0 &&
      !filters.tags.some((tag) => job.tags.includes(tag))
    ) {
      return false;
    }
    if (q) {
      const haystack = [
        job.title,
        job.company,
        job.location,
        job.industry,
        job.subRole,
        job.description,
        ...job.tags,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

/**
 * Jobs are loaded on the server and passed in; all filtering happens in the
 * browser, so the board makes no API calls. `jobs` is null if loading failed.
 */
export function JobBoard({ jobs: initialJobs }: { jobs: JobPosting[] | null }) {
  const jobs = initialJobs ?? [];
  const loadError = initialJobs === null;
  const [filters, setFilters] = useState<JobFilters>(emptyFilters);
  const debouncedSearch = useDebounce(filters.search, 250);

  const filtered = useMemo(
    () => filterJobs(jobs, { ...filters, search: debouncedSearch }),
    [jobs, filters, debouncedSearch]
  );

  return (
    <>
      <JobHero />
      <FilterBar filters={filters} onChange={setFilters} />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <p className="text-sm text-muted-foreground mb-6">
          {`${filtered.length} open role${filtered.length !== 1 ? "s" : ""}`}
        </p>

        {loadError ? (
          <div className="text-center py-20">
            <p className="text-lg font-medium">Couldn&apos;t load jobs</p>
            <p className="text-muted-foreground mt-2">
              Please refresh the page or try again in a moment.
            </p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-medium">No jobs posted yet</p>
            <p className="text-muted-foreground mt-2">
              Recruiters — be the first to post a role.
            </p>
            <Link href="/dashboard/post">
              <Button className="mt-4">Post a Job</Button>
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-medium">No roles match your filters</p>
            <p className="text-muted-foreground mt-2">
              Try adjusting location, profile, or industry filters.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setFilters(emptyFilters)}
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((job, i) => (
                <JobCard key={job.id} job={job} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </>
  );
}

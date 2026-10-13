"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MapPin, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FilterPanel } from "@/components/jobs/FilterPanel";
import { JobCard } from "@/components/jobs/JobCard";
import { locations, postedWithinOptions, salaryOptions, sortOptions } from "@/lib/data/filterHierarchy";
import {
  activeFilterCount,
  emptyJobQuery,
  toQueryString,
  type JobQuery,
  type SortOption,
} from "@/lib/jobQuery";
import { cn } from "@/lib/utils";
import type { JobPage } from "@/types";

/**
 * The job board. Filters live in the URL; every change navigates and the
 * server re-runs the search (no client-side API calls).
 */
export function JobSearch({
  query,
  result,
  now,
  updating = false,
}: {
  query: JobQuery;
  result: JobPage | null;
  now: number;
  /** The database is being upgraded (schema behind the code). */
  updating?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [keyword, setKeyword] = useState(query.q);
  const [city, setCity] = useState(query.location.length === 1 ? query.location[0] : "");

  const navigate = (next: JobQuery) => {
    const qs = toQueryString(next);
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  /** Apply a filter change; any change resets "load more" to the first page. */
  const update = (patch: Partial<JobQuery>) => navigate({ ...query, ...patch, page: 1 });

  // Debounce typing in the keyword box.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (keyword.trim() === query.q) return;
    const t = setTimeout(() => update({ q: keyword.trim() }), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    update({ q: keyword.trim() });
  };

  const clearAll = () => {
    setKeyword("");
    setCity("");
    navigate({ ...emptyJobQuery, sort: query.sort });
  };

  const filterCount = activeFilterCount(query);
  const chips = buildChips(query);

  return (
    <>
      {/* What + where */}
      <section className="border-b border-border bg-gradient-to-br from-saffron/5 via-background to-india-green/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-3xl leading-[1.1]">
            Find your next role.{" "}
            <span className="bg-gradient-to-r from-saffron to-saffron-dark bg-clip-text text-transparent">
              Reach out directly.
            </span>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Filter by skill, city, experience and salary — then call, WhatsApp or email the recruiter. No sign-up.
          </p>

          <form onSubmit={submitSearch} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-4xl" role="search">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Skill, job title or company (e.g. React, Nurse, Tally)"
                aria-label="Keyword"
                className="w-full rounded-xl border border-border bg-surface pl-11 pr-4 py-3.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-saffron/50 focus:border-saffron"
              />
            </div>
            <div className="relative sm:w-56">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  update({ location: e.target.value ? [e.target.value] : [] });
                }}
                aria-label="City"
                className="w-full appearance-none rounded-xl border border-border bg-surface pl-11 pr-4 py-3.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-saffron/50"
              >
                <option value="">All cities</option>
                {locations.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="lg" className="sm:w-auto">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-10 lg:grid lg:grid-cols-[17rem_1fr] lg:gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-saffron" />
                Filters
              </h2>
              {filterCount > 0 && (
                <button onClick={clearAll} className="text-xs font-medium text-saffron-dark dark:text-saffron hover:underline">
                  Clear all
                </button>
              )}
            </div>
            <FilterPanel query={query} onChange={update} />
          </div>
        </aside>

        <section aria-live="polite">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {result ? (
                <>
                  <span className="font-semibold text-foreground">{result.total}</span>
                  {result.total === 1 ? " job" : " jobs"}
                  {query.q && <> for &ldquo;{query.q}&rdquo;</>}
                </>
              ) : (
                "Jobs"
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setDrawerOpen(true)}>
                <SlidersHorizontal className="h-4 w-4" />
                Filters{filterCount > 0 && ` (${filterCount})`}
              </Button>
              <label className="sr-only" htmlFor="sort">
                Sort
              </label>
              <select
                id="sort"
                value={query.sort}
                onChange={(e) => update({ sort: e.target.value as SortOption })}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/50"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-5">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => update(chip.remove)}
                  className="inline-flex items-center gap-1 rounded-full border border-saffron/40 bg-saffron/10 px-2.5 py-1 text-xs font-medium hover:bg-saffron/20"
                  aria-label={`Remove filter ${chip.label}`}
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              <button onClick={clearAll} className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-3 w-3" />
                Clear all
              </button>
            </div>
          )}

          <div className={cn("transition-opacity", pending && "opacity-60")}>
            {result === null ? (
              updating ? (
                <Empty title="We're updating Joblay" text="Jobs will be back in a few minutes. Thanks for your patience." />
              ) : (
                <Empty title="Couldn't load jobs" text="Please refresh the page or try again in a moment." />
              )
            ) : result.total === 0 ? (
              filterCount > 0 || query.q ? (
                <Empty title="No jobs match these filters" text="Try removing a filter or two.">
                  <Button variant="outline" className="mt-4" onClick={clearAll}>
                    Clear all filters
                  </Button>
                </Empty>
              ) : (
                <Empty title="No jobs posted yet" text="Recruiters — be the first to post a role.">
                  <Link href="/dashboard/post">
                    <Button className="mt-4">Post a Job</Button>
                  </Link>
                </Empty>
              )
            ) : (
              <>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {result.jobs.map((job) => (
                    <JobCard key={job.id} job={job} now={now} />
                  ))}
                </div>
                {result.hasMore && (
                  <div className="mt-8 text-center">
                    <Button
                      variant="outline"
                      loading={pending}
                      onClick={() => navigate({ ...query, page: query.page + 1 })}
                    >
                      Load more ({result.total - result.jobs.length} more)
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
            <motion.div
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-background shadow-xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.2 }}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="font-semibold">Filters{filterCount > 0 && ` (${filterCount})`}</h2>
                <button onClick={() => setDrawerOpen(false)} aria-label="Close filters" className="p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4">
                <FilterPanel query={query} onChange={update} />
              </div>
              <div className="flex gap-2 border-t border-border p-4">
                <Button variant="outline" className="flex-1" onClick={clearAll}>
                  Clear all
                </Button>
                <Button className="flex-1" onClick={() => setDrawerOpen(false)} loading={pending}>
                  Show {result?.total ?? 0} jobs
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function Empty({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="text-center py-20 rounded-2xl border border-dashed border-border">
      <p className="text-lg font-medium">{title}</p>
      <p className="text-muted-foreground mt-2">{text}</p>
      {children}
    </div>
  );
}

/** One removable chip per active filter value. */
function buildChips(q: JobQuery): { key: string; label: string; remove: Partial<JobQuery> }[] {
  const chips: { key: string; label: string; remove: Partial<JobQuery> }[] = [];
  const listKeys = ["workMode", "location", "industry", "subRole", "tags", "jobProfile", "jobType", "education"] as const;
  for (const key of listKeys) {
    for (const value of q[key]) {
      chips.push({ key: `${key}:${value}`, label: value, remove: { [key]: q[key].filter((v) => v !== value) } });
    }
  }
  if (q.experience !== undefined) {
    chips.push({
      key: "experience",
      label: q.experience === 0 ? "Fresher" : `${q.experience} yrs exp`,
      remove: { experience: undefined },
    });
  }
  if (q.salary !== undefined) {
    chips.push({
      key: "salary",
      label: salaryOptions.find((o) => o.value === String(q.salary))?.label ?? `${q.salary}+ LPA`,
      remove: { salary: undefined },
    });
  }
  if (q.postedWithin !== undefined) {
    chips.push({
      key: "posted",
      label: postedWithinOptions.find((o) => o.value === String(q.postedWithin))?.label ?? "Recent",
      remove: { postedWithin: undefined },
    });
  }
  if (q.hasPhone) chips.push({ key: "hasPhone", label: "Has phone", remove: { hasPhone: false } });
  if (q.hasEmail) chips.push({ key: "hasEmail", label: "Has email", remove: { hasEmail: false } });
  return chips;
}

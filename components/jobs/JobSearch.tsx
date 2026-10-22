"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { History, LayoutGrid, Loader2, MapPin, RotateCcw, Rows3, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { FilterPanel } from "@/components/jobs/FilterPanel";
import { JobCard } from "@/components/jobs/JobCard";
import { useRecentSearches, useStoredList } from "@/hooks/useStoredList";
import { locations, sortOptions, type Taxonomy } from "@/lib/data/filterHierarchy";
import {
  activeFilterCount,
  emptyJobQuery,
  filterChips,
  toQueryString,
  type FilterChip,
  type JobQuery,
  type SortOption,
} from "@/lib/jobQuery";
import { cn } from "@/lib/utils";
import type { JobPage } from "@/types";

/** A filter to drop when nothing matches, and how many jobs that would show. */
export type FilterSuggestion = FilterChip & { total: number };

/** One-tap shortcuts above the results, each toggling a common filter. */
const toggleIn = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
const quickFilters: { label: string; active: (q: JobQuery) => boolean; toggle: (q: JobQuery) => Partial<JobQuery> }[] = [
  { label: "Fresher", active: (q) => q.experience === 0, toggle: (q) => ({ experience: q.experience === 0 ? undefined : 0 }) },
  { label: "Work from home", active: (q) => q.workMode.includes("Remote"), toggle: (q) => ({ workMode: toggleIn(q.workMode, "Remote") }) },
  { label: "Part-time", active: (q) => q.jobType.includes("Part-time"), toggle: (q) => ({ jobType: toggleIn(q.jobType, "Part-time") }) },
  { label: "Internship", active: (q) => q.jobType.includes("Internship"), toggle: (q) => ({ jobType: toggleIn(q.jobType, "Internship") }) },
  { label: "Posted today", active: (q) => q.postedWithin === 1, toggle: (q) => ({ postedWithin: q.postedWithin === 1 ? undefined : 1 }) },
  { label: "Has phone number", active: (q) => q.hasPhone, toggle: (q) => ({ hasPhone: !q.hasPhone }) },
];

/**
 * The job board. Filters live in the URL; every change navigates and the
 * server re-runs the search (no client-side API calls).
 */
export function JobSearch({
  query,
  taxonomy,
  result,
  now,
  updating = false,
  suggestions = [],
}: {
  query: JobQuery;
  /** Industries → roles → skills, including admin additions. */
  taxonomy: Taxonomy;
  result: JobPage | null;
  now: number;
  /** The database is being upgraded (schema behind the code). */
  updating?: boolean;
  /** When nothing matches: filters whose removal would show jobs. */
  suggestions?: FilterSuggestion[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [keyword, setKeyword] = useState(query.q);
  const [city, setCity] = useState(query.location.length === 1 ? query.location[0] : "");
  const [searchFocused, setSearchFocused] = useState(false);
  const recent = useRecentSearches();
  // Phones: one full card per row, or two compact ones (remembered per device).
  const cardView = useStoredList("joblay-card-view", 1);
  const twoPerRow = cardView.list[0] === "grid";
  // "Load more" keeps the current cards; any other change shows skeletons.
  const [loadingMore, setLoadingMore] = useState(false);

  const navigate = (next: JobQuery, more = false) => {
    const qs = toQueryString(next);
    setLoadingMore(more);
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

  // While the drawer is open: freeze the page behind it, and Escape closes it.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) recent.add(keyword.trim());
    setSearchFocused(false);
    update({ q: keyword.trim() });
  };

  const clearAll = () => {
    setKeyword("");
    setCity("");
    navigate({ ...emptyJobQuery, sort: query.sort });
  };

  const filterCount = activeFilterCount(query);
  const chips = filterChips(query);
  const typed = keyword.trim().toLowerCase();
  const recentShown = searchFocused
    ? recent.list.filter((r) => r.toLowerCase() !== typed && r.toLowerCase().includes(typed))
    : [];
  const pickRecent = (value: string) => {
    recent.add(value);
    setKeyword(value);
    setSearchFocused(false);
    update({ q: value });
  };

  return (
    <>
      {/* What + where */}
      <section className="border-b border-border bg-gradient-to-br from-saffron/5 via-background to-india-green/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-14">
          <h1 className="text-[1.65rem] sm:text-5xl font-bold tracking-tight max-w-3xl leading-[1.15] sm:leading-[1.1]">
            Find your next role.{" "}
            <span className="bg-gradient-to-r from-saffron to-saffron-dark bg-clip-text text-transparent">
              Reach out directly.
            </span>
          </h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl">
            Filter by skill, city, experience and salary — then call, WhatsApp or email the recruiter. No sign-up.
          </p>
        </div>
      </section>

      {/*
        Search bar — sticks under the 4rem navbar while scrolling. Desktop: one
        row (~4.3rem tall). Mobile: keyword on top, then city + Filters.
      */}
      <div className="sticky top-16 z-30 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <form
          onSubmit={submitSearch}
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-wrap sm:flex-nowrap gap-2"
          role="search"
        >
          <div className="relative basis-full sm:basis-auto sm:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                setSearchFocused(false);
                // Remember finished searches (not every debounced keystroke).
                if (keyword.trim().length >= 2) recent.add(keyword.trim());
              }}
              onKeyDown={(e) => e.key === "Escape" && setSearchFocused(false)}
              placeholder="Skill, job title or company (e.g. React, Nurse, Tally)"
              aria-label="Keyword"
              autoComplete="off"
              className="h-11 w-full rounded-xl border border-border bg-surface pl-11 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-saffron/50 focus:border-saffron"
            />
            {recentShown.length > 0 && (
              <div className="absolute left-0 right-0 top-12 z-40 rounded-xl border border-border bg-surface p-1.5 shadow-xl">
                <p className="px-2.5 pt-1 pb-1.5 text-xs font-medium text-muted-foreground">Recent searches</p>
                {recentShown.map((r) => (
                  <div key={r} className="flex items-center rounded-lg hover:bg-muted">
                    <button
                      type="button"
                      // mousedown (not click) so it fires before the input loses focus
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pickRecent(r);
                      }}
                      className="flex flex-1 items-center gap-2.5 px-2.5 py-2 text-left text-sm min-w-0"
                    >
                      <History className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{r}</span>
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        recent.remove(r);
                      }}
                      aria-label={`Remove "${r}" from recent searches`}
                      className="p-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative flex-1 sm:flex-none sm:w-56">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                update({ location: e.target.value ? [e.target.value] : [] });
              }}
              aria-label="City"
              className="h-11 w-full appearance-none rounded-xl border border-border bg-surface pl-11 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-saffron/50"
            >
              <option value="">All cities</option>
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" variant="outline" className="lg:hidden px-4" onClick={() => setDrawerOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {filterCount > 0 && (
              <span className="rounded-full bg-saffron px-1.5 text-[11px] leading-5 text-white">{filterCount}</span>
            )}
          </Button>
          <Button type="submit" className="hidden sm:inline-flex">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </form>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10 lg:grid lg:grid-cols-[17rem_1fr] lg:gap-8">
        {/* Desktop sidebar — sticks just below the navbar + search bar (4rem + ~4.3rem). */}
        <aside className="hidden lg:block sticky top-38 self-start" aria-label="Filters">
          <div className="max-h-[calc(100vh-10.5rem)] overflow-y-auto overscroll-contain pr-2">
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
            <FilterPanel query={query} taxonomy={taxonomy} onChange={update} />
          </div>
        </aside>

        <section aria-live="polite" className="min-w-0">
          {/* Quick filters — scroll sideways on small screens */}
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {quickFilters.map((f) => {
              const on = f.active(query);
              return (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => update(f.toggle(query))}
                  aria-pressed={on}
                  className={cn(
                    "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    on
                      ? "border-saffron bg-saffron text-white"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground hover:border-saffron/50"
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {result ? (
                <span>
                  <span className="font-semibold text-foreground">{result.total}</span>
                  {result.total === 1 ? " job" : " jobs"}
                  {query.q && <> for &ldquo;{query.q}&rdquo;</>}
                </span>
              ) : (
                "Jobs"
              )}
            </p>
            <div className="flex items-center gap-2">
              <div className="sm:hidden flex rounded-lg border border-border bg-surface p-0.5" role="group" aria-label="Cards per row">
                {(
                  [
                    ["list", Rows3, "One job per row"],
                    ["grid", LayoutGrid, "Two jobs per row"],
                  ] as const
                ).map(([value, Icon, label]) => {
                  const on = (value === "grid") === twoPerRow;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => cardView.add(value)}
                      aria-pressed={on}
                      aria-label={label}
                      title={label}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                        on ? "bg-saffron text-white" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
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

          <div className={cn("transition-opacity", pending && loadingMore && "opacity-60")}>
            {pending && !loadingMore ? (
              <div
                className={cn("grid xl:grid-cols-2 gap-4", twoPerRow ? "grid-cols-2 max-sm:gap-2 sm:grid-cols-1" : "grid-cols-1")}
                aria-label="Loading jobs"
              >
                {Array.from({ length: 4 }, (_, i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            ) : result === null ? (
              updating ? (
                <Empty title="We're updating Joblay" text="Jobs will be back in a few minutes. Thanks for your patience." />
              ) : (
                <Empty title="Couldn't load jobs" text="Please refresh the page or try again in a moment." />
              )
            ) : result.total === 0 ? (
              filterCount > 0 || query.q ? (
                <Empty
                  title="No jobs match these filters"
                  text={suggestions.length ? "Try removing one of these:" : "Try removing a filter or two."}
                >
                  {suggestions.length > 0 && (
                    <div className="mt-4 flex flex-wrap justify-center gap-2 px-4">
                      {suggestions.map((s) => (
                        <button
                          key={s.key}
                          onClick={() => update(s.remove)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-saffron/40 bg-saffron/10 px-3 py-1.5 text-sm font-medium hover:bg-saffron/20"
                        >
                          <X className="h-3.5 w-3.5" />
                          Remove {s.label}
                          <span className="text-muted-foreground font-normal">
                            → {s.total} job{s.total === 1 ? "" : "s"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
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
                <div
                  className={cn("grid xl:grid-cols-2 gap-4", twoPerRow ? "grid-cols-2 max-sm:gap-2 sm:grid-cols-1" : "grid-cols-1")}
                >
                  {result.jobs.map((job) => (
                    <JobCard key={job.id} job={job} now={now} compact={twoPerRow} />
                  ))}
                </div>
                {result.hasMore && (
                  <div className="mt-8 text-center">
                    <Button
                      variant="outline"
                      loading={pending}
                      onClick={() => navigate({ ...query, page: query.page + 1 }, true)}
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
              className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-background shadow-xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="font-semibold">Filters{filterCount > 0 && ` (${filterCount})`}</h2>
                <button onClick={() => setDrawerOpen(false)} aria-label="Close filters" className="p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4">
                <FilterPanel query={query} taxonomy={taxonomy} onChange={update} />
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

function JobCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="mt-4 flex gap-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="mt-3 flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-4/5" />
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </div>
    </div>
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

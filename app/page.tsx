import type { Metadata } from "next";
import { JobSearch, type FilterSuggestion } from "@/components/jobs/JobSearch";
import { activeFilterCount, filterChips, parseJobQuery } from "@/lib/jobQuery";
import { SchemaOutdatedError, searchJobs } from "@/lib/repository";
import { getTaxonomy } from "@/lib/taxonomy";
import type { JobPage } from "@/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const q = parseJobQuery(await searchParams, Object.keys(await getTaxonomy()));
  const what = q.q || q.tags[0] || q.subRole[0] || q.industry[0];
  const where = q.location.length === 1 ? q.location[0] : "";
  if (!what && !where) return {};
  return {
    title: `${what ? `${what} jobs` : "Jobs"}${where ? ` in ${where}` : ""}`,
    // Index the plain board and single-facet pages; not every combination.
    robots: activeFilterCount(q) + (q.q ? 1 : 0) > 2 ? { index: false } : undefined,
  };
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const taxonomy = await getTaxonomy();
  const query = parseJobQuery(await searchParams, Object.keys(taxonomy));

  let result: JobPage | null = null;
  let updating = false;
  try {
    result = await searchJobs(query);
  } catch (err) {
    updating = err instanceof SchemaOutdatedError;
    console.error("[home] job search failed", err instanceof Error ? err.message : err);
  }

  // No results: for each active filter (up to 6), count the jobs found without it,
  // so the page can say "Remove Remote → 24 jobs".
  let suggestions: FilterSuggestion[] = [];
  if (result?.total === 0) {
    const chips = filterChips(query).slice(0, 6);
    const totals = await Promise.all(
      chips.map((c) =>
        searchJobs({ ...query, ...c.remove, page: 1 })
          .then((r) => r.total)
          .catch(() => 0)
      )
    );
    suggestions = chips
      .map((c, i) => ({ ...c, total: totals[i] }))
      .filter((s) => s.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }

  // eslint-disable-next-line react-hooks/purity -- request time, used for "posted N days ago"
  const now = Date.now();
  return (
    <JobSearch
      query={query}
      taxonomy={taxonomy}
      result={result}
      now={now}
      updating={updating}
      suggestions={suggestions}
    />
  );
}

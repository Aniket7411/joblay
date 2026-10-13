import type { Metadata } from "next";
import { JobSearch } from "@/components/jobs/JobSearch";
import { activeFilterCount, parseJobQuery } from "@/lib/jobQuery";
import { SchemaOutdatedError, searchJobs } from "@/lib/repository";
import type { JobPage } from "@/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const q = parseJobQuery(await searchParams);
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
  const query = parseJobQuery(await searchParams);

  let result: JobPage | null = null;
  let updating = false;
  try {
    result = await searchJobs(query);
  } catch (err) {
    updating = err instanceof SchemaOutdatedError;
    console.error("[home] job search failed", err instanceof Error ? err.message : err);
  }

  // eslint-disable-next-line react-hooks/purity -- request time, used for "posted N days ago"
  const now = Date.now();
  return <JobSearch query={query} result={result} now={now} updating={updating} />;
}

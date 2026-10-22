/**
 * Job search filters ⇄ URL query string. Shared by the home page (server),
 * GET /api/jobs, and the filter sidebar (client) — no server-only imports.
 *
 * Multi-value filters are comma-separated: ?location=Pune,Mumbai&workMode=Remote
 */
import {
  educationLevels,
  industries,
  jobProfiles,
  jobTypes,
  locations,
  MAX_EXPERIENCE_YEARS,
  postedWithinOptions,
  salaryOptions,
  sortOptions,
  workModes,
} from "@/lib/data/filterHierarchy";

export const PAGE_SIZE = 20;
export const MAX_PAGES = 25;

export type SortOption = (typeof sortOptions)[number]["value"];

export interface JobQuery {
  q: string;
  location: string[];
  industry: string[];
  subRole: string[];
  tags: string[];
  jobProfile: string[];
  workMode: string[];
  jobType: string[];
  education: string[];
  /** Candidate's years of experience: jobs whose range includes it. */
  experience?: number;
  /** Minimum salary in LPA. */
  salary?: number;
  /** Posted within the last N days. */
  postedWithin?: number;
  hasPhone: boolean;
  hasEmail: boolean;
  sort: SortOption;
  /** "Load more" depth: show the first page × PAGE_SIZE results. */
  page: number;
}

export const emptyJobQuery: JobQuery = {
  q: "",
  location: [],
  industry: [],
  subRole: [],
  tags: [],
  jobProfile: [],
  workMode: [],
  jobType: [],
  education: [],
  hasPhone: false,
  hasEmail: false,
  sort: "newest",
  page: 1,
};

type Params = URLSearchParams | Record<string, string | string[] | undefined>;

function get(params: Params, key: string): string {
  const v = params instanceof URLSearchParams ? params.get(key) : params[key];
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

function list(params: Params, key: string, allowed?: readonly string[]): string[] {
  const values = get(params, key)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 50);
  const unique = [...new Set(values)];
  return allowed ? unique.filter((v) => allowed.includes(v)) : unique.map((v) => v.slice(0, 80));
}

function int(params: Params, key: string, min: number, max: number): number | undefined {
  const raw = get(params, key);
  if (raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : undefined;
}

/**
 * Parses and sanitizes filters from a URL query (unknown values are dropped).
 * Pass `allIndustries` (keys of getTaxonomy()) so admin-added industries count.
 */
export function parseJobQuery(params: Params, allIndustries: readonly string[] = industries): JobQuery {
  const sort = get(params, "sort");
  const posted = get(params, "postedWithin");
  return {
    q: get(params, "q").trim().slice(0, 100),
    location: list(params, "location", locations),
    industry: list(params, "industry", allIndustries),
    subRole: list(params, "subRole"),
    tags: list(params, "tags"),
    jobProfile: list(params, "jobProfile", jobProfiles),
    workMode: list(params, "workMode", workModes),
    jobType: list(params, "jobType", jobTypes),
    education: list(params, "education", educationLevels),
    experience: int(params, "experience", 0, MAX_EXPERIENCE_YEARS),
    salary: int(params, "salary", 0, 500),
    postedWithin: postedWithinOptions.some((o) => o.value === posted) ? Number(posted) : undefined,
    hasPhone: get(params, "hasPhone") === "1",
    hasEmail: get(params, "hasEmail") === "1",
    sort: sortOptions.some((o) => o.value === sort) ? (sort as SortOption) : "newest",
    page: int(params, "page", 1, MAX_PAGES) ?? 1,
  };
}

/** Serializes filters to a query string, omitting defaults. */
export function toQueryString(q: JobQuery): string {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  const lists: (keyof JobQuery)[] = [
    "location", "industry", "subRole", "tags", "jobProfile", "workMode", "jobType", "education",
  ];
  for (const key of lists) {
    const v = q[key] as string[];
    if (v.length) p.set(key, v.join(","));
  }
  if (q.experience !== undefined) p.set("experience", String(q.experience));
  if (q.salary !== undefined) p.set("salary", String(q.salary));
  if (q.postedWithin !== undefined) p.set("postedWithin", String(q.postedWithin));
  if (q.hasPhone) p.set("hasPhone", "1");
  if (q.hasEmail) p.set("hasEmail", "1");
  if (q.sort !== "newest") p.set("sort", q.sort);
  if (q.page > 1) p.set("page", String(q.page));
  return p.toString();
}

/** Number of active filters (keyword, sort and paging excluded). */
export function activeFilterCount(q: JobQuery): number {
  return (
    q.location.length + q.industry.length + q.subRole.length + q.tags.length +
    q.jobProfile.length + q.workMode.length + q.jobType.length + q.education.length +
    (q.experience !== undefined ? 1 : 0) + (q.salary !== undefined ? 1 : 0) +
    (q.postedWithin !== undefined ? 1 : 0) + (q.hasPhone ? 1 : 0) + (q.hasEmail ? 1 : 0)
  );
}

/** "3-5 yrs", "Fresher", "10+ yrs" */
export function formatExperience(min: number, max: number): string {
  if (max === 0) return "Fresher";
  if (max >= MAX_EXPERIENCE_YEARS) return min === 0 ? "Any experience" : `${min}+ yrs`;
  if (min === max) return `${min} yrs`;
  return `${min}-${max} yrs`;
}

/** "6-10 LPA", "Not disclosed" */
export function formatSalary(min?: number, max?: number): string {
  if (min === undefined || max === undefined) return "Not disclosed";
  const f = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  return min === max ? `${f(min)} LPA` : `${f(min)}-${f(max)} LPA`;
}

/** "Today", "3 days ago", "2 weeks ago" */
export function postedAgo(iso: string, now = Date.now()): string {
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days < 14 ? "" : "s"} ago`;
  return `${Math.floor(days / 30)} month${days < 60 ? "" : "s"} ago`;
}

export interface FilterChip {
  key: string;
  label: string;
  /** Patch that removes just this value. */
  remove: Partial<JobQuery>;
}

/** One removable chip per active filter value. */
export function filterChips(q: JobQuery): FilterChip[] {
  const chips: FilterChip[] = [];
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

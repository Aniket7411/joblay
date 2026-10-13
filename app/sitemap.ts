import type { MetadataRoute } from "next";
import { emptyJobQuery, MAX_PAGES } from "@/lib/jobQuery";
import { searchJobs } from "@/lib/repository";

// Rebuilt at most hourly.
export const revalidate = 3600;

const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = ["", "/about", "/safety", "/faq", "/contact", "/privacy", "/terms"].map(
    (path) => ({ url: `${base}${path}`, changeFrequency: path ? "monthly" : "hourly", priority: path ? 0.3 : 1 })
  );

  try {
    const { jobs } = await searchJobs({ ...emptyJobQuery, page: MAX_PAGES });
    return [
      ...pages,
      ...jobs.map((job) => ({
        url: `${base}/jobs/${job.id}`,
        lastModified: job.updatedAt ?? job.createdAt,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    ];
  } catch (err) {
    console.error("[sitemap] job lookup failed", err);
    return pages;
  }
}

import { connection } from "next/server";
import { JobBoard } from "@/components/jobs/JobBoard";
import { listJobs } from "@/lib/repository";
import type { JobPosting } from "@/types";

export default async function HomePage() {
  // Render per request so newly posted jobs show up immediately.
  await connection();

  let jobs: JobPosting[] | null;
  try {
    jobs = await listJobs();
  } catch (err) {
    console.error("[home] failed to load jobs", err);
    jobs = null;
  }
  return <JobBoard jobs={jobs} />;
}

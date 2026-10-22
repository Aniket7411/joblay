import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getCurrentRecruiter } from "@/lib/auth/current";
import { getJobStats, listJobs } from "@/lib/repository";

export const metadata = {
  title: "Recruiter Dashboard",
  description: "Manage your job postings",
};

export default async function DashboardPage() {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) redirect("/login");
  const jobs = await listJobs({ recruiterId: recruiter.id });
  // Counts are a nice-to-have: show the dashboard even if they can't be read.
  const stats = await getJobStats(jobs.map((j) => j.id)).catch((err) => {
    console.error("[dashboard] stats unavailable:", err instanceof Error ? err.message : err);
    return {};
  });
  // eslint-disable-next-line react-hooks/purity -- request time, for expiry labels
  const now = Date.now();
  return <DashboardClient recruiter={recruiter} initialJobs={jobs} stats={stats} now={now} />;
}

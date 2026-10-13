import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getCurrentRecruiter } from "@/lib/auth/current";
import { listJobs } from "@/lib/repository";

export const metadata = {
  title: "Recruiter Dashboard",
  description: "Manage your job postings",
};

export default async function DashboardPage() {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) redirect("/login");
  const jobs = await listJobs({ recruiterId: recruiter.id, includeSuspended: true });
  return <DashboardClient recruiter={recruiter} initialJobs={jobs} />;
}

import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getCurrentRecruiter } from "@/lib/auth/current";

export const metadata = {
  title: "Recruiter Dashboard",
  description: "Manage your job postings",
};

export default async function DashboardPage() {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) redirect("/login");
  return <DashboardClient recruiter={recruiter} />;
}

import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const metadata = {
  title: "Recruiter Dashboard",
  description: "Manage your job postings",
};

export default function DashboardPage() {
  return <DashboardClient />;
}

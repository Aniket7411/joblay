import { redirect } from "next/navigation";
import { getCurrentRecruiter } from "@/lib/auth/current";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) redirect("/login");
  return children;
}

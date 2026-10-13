import { notFound, redirect } from "next/navigation";
import { AdminClient } from "@/components/admin/AdminClient";
import { getCurrentRecruiter } from "@/lib/auth/current";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const user = await getCurrentRecruiter();
  if (!user) redirect("/login");
  // Don't reveal the admin area exists to non-admins.
  if (user.role !== "admin") notFound();
  return <AdminClient admin={user} />;
}

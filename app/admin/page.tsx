import { notFound, redirect } from "next/navigation";
import { AdminClient } from "@/components/admin/AdminClient";
import { getCurrentRecruiter } from "@/lib/auth/current";
import { getBulkHiringPopup } from "@/lib/bulkHiring";
import { listContactMessages, listJobs, listRecruiters, listTaxonomyEntries } from "@/lib/repository";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const user = await getCurrentRecruiter();
  if (!user) redirect("/login");
  // Don't reveal the admin area exists to non-admins.
  if (user.role !== "admin") notFound();
  const [jobs, recruiters, messages, categories, popup] = await Promise.all([
    listJobs(),
    listRecruiters(),
    listContactMessages(),
    // Before migration 0004 the table is missing; show the rest of the panel anyway.
    listTaxonomyEntries().catch((err) => {
      console.error("[admin] categories unavailable:", err instanceof Error ? err.message : err);
      return [];
    }),
    getBulkHiringPopup(),
  ]);
  return (
    <AdminClient
      admin={user}
      initialData={{ jobs, recruiters, messages }}
      initialCategories={categories}
      initialPopup={popup}
    />
  );
}

import * as motion from "framer-motion/client";
import { redirect } from "next/navigation";
import { Copy, FileText } from "lucide-react";
import { JobPostForm } from "@/components/forms/JobPostForm";
import { getCurrentRecruiter } from "@/lib/auth/current";
import { MAX_EXPERIENCE_YEARS } from "@/lib/data/filterHierarchy";
import { jobToFormValues } from "@/lib/jobInput";
import { getJobById, listJobs } from "@/lib/repository";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { JobPostFormData } from "@/lib/validations";

export const metadata = {
  title: "Post a Job",
};

export default async function PostJobPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await getCurrentRecruiter();
  if (!user) redirect("/login");

  const { from } = await searchParams;
  let initialValues: Partial<JobPostFormData>;
  let duplicating = false;

  // "Duplicate": start from an existing job (own job, or any job for admins).
  const source = from ? await getJobById(from) : null;
  if (source && (user.role === "admin" || source.recruiterId === user.id)) {
    initialValues = { ...jobToFormValues(source), attachmentUrl: "" };
    duplicating = true;
  } else {
    // Otherwise pre-fill the contact details from the recruiter's last job.
    const [last] = await listJobs({ recruiterId: user.id });
    initialValues = {
      tags: [],
      workMode: "Office",
      jobType: "Full-time",
      education: "Any",
      experienceMin: "0",
      experienceMax: String(MAX_EXPERIENCE_YEARS),
      openings: "1",
      company: last?.company ?? user.company ?? "",
      contactName: last?.contact.name ?? user.name,
      contactEmail: last?.contact.email ?? user.email,
      contactPhone: last?.contact.phone ?? "",
    };
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron/10 text-saffron">
            {duplicating ? <Copy className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {duplicating ? "Duplicate Job" : "Post a Job"}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {duplicating
            ? `Copied from "${source?.title}". Change what you need and post it as a new job.`
            : "Add a new job description. Candidates will contact you directly."}
        </p>
      </motion.div>
      <JobPostForm uploadsEnabled={isSupabaseConfigured()} initialValues={initialValues} />
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { Pencil } from "lucide-react";
import { JobPostForm } from "@/components/forms/JobPostForm";
import { getCurrentRecruiter } from "@/lib/auth/current";
import { jobToFormValues } from "@/lib/jobInput";
import { getJobById } from "@/lib/repository";
import { isSupabaseConfigured } from "@/lib/supabase";
import { isAiEnabled } from "@/lib/ai/parseJd";

export const metadata = { title: "Edit Job" };

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentRecruiter();
  if (!user) redirect("/login");

  const { id } = await params;
  const job = await getJobById(id);
  const isAdmin = user.role === "admin";
  if (!job || (!isAdmin && job.recruiterId !== user.id)) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron/10 text-saffron">
            <Pencil className="h-5 w-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Edit Job</h1>
        </div>
        <p className="text-muted-foreground">
          {job.title} · {job.company}
          {isAdmin && job.recruiterId !== user.id && " — editing as admin"}
        </p>
      </div>
      <JobPostForm
        jobId={job.id}
        initialValues={jobToFormValues(job)}
        uploadsEnabled={isSupabaseConfigured()}
        aiEnabled={isAiEnabled()}
        redirectTo={isAdmin ? "/admin" : "/dashboard"}
      />
    </div>
  );
}

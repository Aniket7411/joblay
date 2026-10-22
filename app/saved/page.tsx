import type { Metadata } from "next";
import { SavedJobs } from "@/components/jobs/SavedJobs";

export const metadata: Metadata = {
  title: "Saved jobs",
  robots: { index: false },
};

export default function SavedPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Saved jobs</h1>
      <p className="mt-1 mb-6 text-muted-foreground">Saved on this device only — no account needed.</p>
      <SavedJobs />
    </div>
  );
}

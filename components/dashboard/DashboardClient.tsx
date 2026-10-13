"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useFetch } from "@/hooks/useFetch";
import type { JobPosting, Recruiter } from "@/types";

export function DashboardClient({ recruiter }: { recruiter: Recruiter }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const { execute, loading } = useFetch<JobPosting[]>();

  useEffect(() => {
    execute("/api/jobs?mine=1").then((result) => {
      if (result.success && result.data) setJobs(result.data);
    });
  }, [execute]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job posting?")) return;
    const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) setJobs((prev) => prev.filter((j) => j.id !== id));
    else alert(json.message || "Could not delete job");
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruiter Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome, {recruiter.name}
            {recruiter.company ? ` · ${recruiter.company}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/post">
            <Button>
              <Plus className="h-4 w-4" />
              Post New JD
            </Button>
          </Link>
          <Button variant="outline" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </motion.div>

      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Briefcase className="h-5 w-5 text-saffron" />
        Your Past JDs ({jobs.length})
      </h2>

      {loading ? (
        <p className="text-muted-foreground">Loading your postings...</p>
      ) : jobs.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground mb-4">No job postings yet.</p>
          <Link href="/dashboard/post">
            <Button>
              <Plus className="h-4 w-4" />
              Post Your First Job
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {job.company} · {job.location} ·{" "}
                    {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge variant="saffron">{job.industry}</Badge>
                    <Badge variant="outline">{job.subRole}</Badge>
                    {job.tags.slice(0, 2).map((t) => (
                      <Badge key={t} variant="outline">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(job.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

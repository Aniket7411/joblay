"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Briefcase, Pencil, Plus, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { JobPosting, Recruiter } from "@/types";

export function DashboardClient({
  recruiter,
  initialJobs,
}: {
  recruiter: Recruiter;
  initialJobs: JobPosting[];
}) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);

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
        <div className="flex flex-wrap gap-2">
          {recruiter.role === "admin" && (
            <Link href="/admin">
              <Button variant="secondary">
                <Shield className="h-4 w-4" />
                Admin Panel
              </Button>
            </Link>
          )}
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

      {jobs.length === 0 ? (
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
                <div className="flex gap-2 shrink-0">
                  <Link href={`/dashboard/jobs/${job.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(job.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

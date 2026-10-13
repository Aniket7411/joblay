"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Briefcase,
  Copy,
  ExternalLink,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  XCircle,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatExperience, formatSalary } from "@/lib/jobQuery";
import { cn } from "@/lib/utils";
import type { JobPosting, Recruiter } from "@/types";

type JobState = "live" | "closed" | "expired";
const DAY = 86_400_000;

function stateOf(job: JobPosting, now: number): JobState {
  if (job.status === "closed") return "closed";
  return new Date(job.expiresAt).getTime() <= now ? "expired" : "live";
}

export function DashboardClient({
  recruiter,
  initialJobs,
  now,
}: {
  recruiter: Recruiter;
  initialJobs: JobPosting[];
  now: number;
}) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [filter, setFilter] = useState<JobState | "all">("all");
  const [busy, setBusy] = useState<string | null>(null);

  const replaceJob = (updated: JobPosting) =>
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));

  const changeStatus = async (job: JobPosting, action: "close" | "reopen" | "renew") => {
    setBusy(job.id);
    try {
      const res = await fetch(`/api/jobs/${job.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.success) replaceJob(json.data);
      else alert(json.message || "Could not update job");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job posting permanently? Closing it keeps a copy you can reopen.")) return;
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

  const counts = { live: 0, closed: 0, expired: 0 };
  for (const j of jobs) counts[stateOf(j, now)]++;
  const shown = filter === "all" ? jobs : jobs.filter((j) => stateOf(j, now) === filter);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
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
              Post New Job
            </Button>
          </Link>
          <Button variant="outline" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </motion.div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <h2 className="text-lg font-semibold flex items-center gap-2 mr-2">
          <Briefcase className="h-5 w-5 text-saffron" />
          Your Jobs
        </h2>
        {(
          [
            ["all", `All (${jobs.length})`],
            ["live", `Live (${counts.live})`],
            ["expired", `Expired (${counts.expired})`],
            ["closed", `Closed (${counts.closed})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filter === value ? "bg-saffron text-white" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

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
      ) : shown.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">No {filter} jobs.</Card>
      ) : (
        <div className="space-y-3">
          {shown.map((job) => {
            const state = stateOf(job, now);
            const daysLeft = Math.ceil((new Date(job.expiresAt).getTime() - now) / DAY);
            return (
              <Card key={job.id} className={cn("p-5", state !== "live" && "opacity-80")}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{job.title}</h3>
                      {state === "live" && (
                        <Badge variant="green">Live · {daysLeft} day{daysLeft === 1 ? "" : "s"} left</Badge>
                      )}
                      {state === "expired" && <Badge variant="outline">Expired</Badge>}
                      {state === "closed" && <Badge variant="outline">Closed</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {job.company} · {job.location} · {job.workMode} · {job.jobType}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatExperience(job.experienceMin, job.experienceMax)} ·{" "}
                      {formatSalary(job.salaryMin, job.salaryMax)} · posted{" "}
                      {new Date(job.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Link href={`/jobs/${job.id}`} target="_blank">
                      <Button variant="ghost" size="sm" aria-label="View public page">
                        <ExternalLink className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/dashboard/jobs/${job.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/dashboard/post?from=${job.id}`}>
                      <Button variant="outline" size="sm">
                        <Copy className="h-3.5 w-3.5" />
                        Duplicate
                      </Button>
                    </Link>
                    {state === "live" && daysLeft <= 7 && (
                      <Button variant="outline" size="sm" loading={busy === job.id} onClick={() => changeStatus(job, "renew")}>
                        <RefreshCw className="h-3.5 w-3.5" />
                        Renew
                      </Button>
                    )}
                    {state === "live" ? (
                      <Button variant="outline" size="sm" loading={busy === job.id} onClick={() => changeStatus(job, "close")}>
                        <XCircle className="h-3.5 w-3.5" />
                        Close
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" loading={busy === job.id} onClick={() => changeStatus(job, "reopen")}>
                        <PlayCircle className="h-3.5 w-3.5" />
                        {state === "expired" ? "Renew" : "Reopen"}
                      </Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => handleDelete(job.id)} aria-label="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

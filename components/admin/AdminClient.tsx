"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Briefcase,
  ExternalLink,
  Paperclip,
  Search,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useFetch } from "@/hooks/useFetch";
import { cn } from "@/lib/utils";
import type { JobPosting, Recruiter, RecruiterSummary } from "@/types";

type Tab = "jobs" | "recruiters";

interface Overview {
  jobs: JobPosting[];
  recruiters: RecruiterSummary[];
}

export function AdminClient({ admin }: { admin: Recruiter }) {
  const router = useRouter();
  const { execute, loading, error } = useFetch<Overview>();
  const [data, setData] = useState<Overview>({ jobs: [], recruiters: [] });
  const [tab, setTab] = useState<Tab>("jobs");
  const [query, setQuery] = useState("");
  const [weekAgo] = useState(() => Date.now() - 7 * 864e5);

  useEffect(() => {
    execute("/api/admin/overview").then((result) => {
      if (result.success && result.data) setData(result.data);
    });
  }, [execute]);

  const recruiterById = useMemo(
    () => new Map(data.recruiters.map((r) => [r.id, r])),
    [data.recruiters]
  );

  const q = query.trim().toLowerCase();
  const jobs = data.jobs.filter((j) => {
    if (!q) return true;
    const owner = recruiterById.get(j.recruiterId);
    return [j.title, j.company, j.location, j.industry, owner?.email, owner?.name]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
  const recruiters = data.recruiters.filter((r) =>
    !q ? true : [r.name, r.email, r.company].join(" ").toLowerCase().includes(q)
  );

  const deleteJob = async (job: JobPosting) => {
    if (!confirm(`Delete "${job.title}" at ${job.company}? This can't be undone.`)) return;
    const res = await fetch(`/api/admin/jobs/${job.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) return alert(json.message || "Could not delete job");
    setData((prev) => ({
      jobs: prev.jobs.filter((j) => j.id !== job.id),
      recruiters: prev.recruiters.map((r) =>
        r.id === job.recruiterId ? { ...r, jobCount: r.jobCount - 1 } : r
      ),
    }));
  };

  const deleteRecruiter = async (r: RecruiterSummary) => {
    if (
      !confirm(
        `Delete ${r.email} and all ${r.jobCount} of their job posting(s)? This can't be undone.`
      )
    )
      return;
    const res = await fetch(`/api/admin/recruiters/${r.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) return alert(json.message || "Could not delete recruiter");
    setData((prev) => ({
      jobs: prev.jobs.filter((j) => j.recruiterId !== r.id),
      recruiters: prev.recruiters.filter((x) => x.id !== r.id),
    }));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const stats = [
    { label: "Live jobs", value: data.jobs.length, icon: Briefcase },
    {
      label: "Recruiters",
      value: data.recruiters.filter((r) => r.role === "recruiter").length,
      icon: Users,
    },
    {
      label: "Jobs this week",
      value: data.jobs.filter((j) => new Date(j.createdAt).getTime() > weekAgo)
        .length,
      icon: Briefcase,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-7 w-7 text-saffron" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">Signed in as {admin.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/post">
            <Button variant="secondary">Post a Job</Button>
          </Link>
          <Button variant="outline" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-saffron/10 text-saffron">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{loading ? "—" : value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="inline-flex rounded-xl border border-border bg-surface p-1">
          {(["jobs", "recruiters"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors",
                tab === t
                  ? "bg-saffron text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t} ({t === "jobs" ? data.jobs.length : data.recruiters.length})
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === "jobs" ? "Search jobs or recruiter email" : "Search recruiters"}
            className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/50 focus:border-saffron"
            aria-label="Search"
          />
        </div>
      </div>

      {error ? (
        <Card className="p-8 text-center text-red-500">{error}</Card>
      ) : loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : tab === "jobs" ? (
        jobs.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">No jobs found.</Card>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const owner = recruiterById.get(job.recruiterId);
              return (
                <Card
                  key={job.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <h3 className="font-semibold">{job.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {job.company} · {job.location} ·{" "}
                      {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      Posted by {owner ? `${owner.name} (${owner.email})` : "unknown"}
                      {" · "}Contact:{" "}
                      {[job.contact.name, job.contact.email, job.contact.phone]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant="saffron">{job.industry}</Badge>
                      <Badge variant="outline">{job.subRole}</Badge>
                      {job.attachmentUrl && (
                        <a href={job.attachmentUrl} target="_blank" rel="noopener noreferrer">
                          <Badge variant="outline" className="gap-1">
                            <Paperclip className="h-3 w-3" />
                            JD file
                            <ExternalLink className="h-3 w-3" />
                          </Badge>
                        </a>
                      )}
                    </div>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => deleteJob(job)}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </Card>
              );
            })}
          </div>
        )
      ) : recruiters.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No recruiters found.</Card>
      ) : (
        <div className="space-y-3">
          {recruiters.map((r) => (
            <Card
              key={r.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <h3 className="font-semibold flex items-center gap-2">
                  {r.name}
                  {r.role === "admin" && <Badge variant="green">Admin</Badge>}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {r.email}
                  {r.company ? ` · ${r.company}` : ""}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {r.jobCount} job{r.jobCount === 1 ? "" : "s"} · joined{" "}
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              {r.role === "recruiter" && (
                <Button variant="danger" size="sm" onClick={() => deleteRecruiter(r)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete account
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

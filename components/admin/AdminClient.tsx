"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ban,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Download,
  ExternalLink,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Mail,
  Paperclip,
  Pencil,
  Phone,
  RotateCcw,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { industries, locations } from "@/lib/data/filterHierarchy";
import { cn } from "@/lib/utils";
import { contactTopics } from "@/lib/validations";
import type {
  AdminOverview,
  ContactMessage,
  JobPosting,
  Recruiter,
  RecruiterSummary,
} from "@/types";

type Tab = "overview" | "jobs" | "employers" | "messages";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
const fmtDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never";
const topicLabel = (t: string) => contactTopics.find((x) => x.value === t)?.label ?? t;

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return (await res.json()) as { success: boolean; message: string; data?: unknown };
}

export function AdminClient({
  admin,
  initialData,
}: {
  admin: Recruiter;
  initialData: AdminOverview;
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<Tab>("overview");
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [weekAgo] = useState(() => Date.now() - WEEK_MS);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const recruiterById = useMemo(
    () => new Map(data.recruiters.map((r) => [r.id, r])),
    [data.recruiters]
  );

  /* ---------------- actions ---------------- */

  const deleteJob = async (job: JobPosting) => {
    if (!confirm(`Delete "${job.title}" at ${job.company}? This can't be undone.`)) return;
    const json = await api(`/api/admin/jobs/${job.id}`, "DELETE");
    setNotice({ ok: json.success, text: json.message });
    if (!json.success) return;
    setData((prev) => ({
      ...prev,
      jobs: prev.jobs.filter((j) => j.id !== job.id),
      recruiters: prev.recruiters.map((r) =>
        r.id === job.recruiterId ? { ...r, jobCount: r.jobCount - 1 } : r
      ),
    }));
  };

  const updateEmployer = async (
    r: RecruiterSummary,
    patch: Partial<Pick<Recruiter, "status" | "role">>,
    confirmText: string
  ) => {
    if (!confirm(confirmText)) return;
    const json = await api(`/api/admin/recruiters/${r.id}`, "PATCH", patch);
    setNotice({ ok: json.success, text: json.success ? `${r.email}: ${json.message}` : json.message });
    if (!json.success) return;
    setData((prev) => ({
      ...prev,
      recruiters: prev.recruiters.map((x) => (x.id === r.id ? { ...x, ...patch } : x)),
    }));
  };

  const sendReset = async (r: RecruiterSummary) => {
    if (!confirm(`Email a password reset link to ${r.email}?`)) return;
    const json = await api(`/api/admin/recruiters/${r.id}/reset-password`, "POST");
    setNotice({ ok: json.success, text: json.message });
  };

  const deleteEmployer = async (r: RecruiterSummary) => {
    if (
      !confirm(
        `Permanently delete ${r.email} and all ${r.jobCount} of their job posting(s)? This can't be undone.`
      )
    )
      return;
    const json = await api(`/api/admin/recruiters/${r.id}`, "DELETE");
    setNotice({ ok: json.success, text: json.message });
    if (!json.success) return;
    setData((prev) => ({
      ...prev,
      jobs: prev.jobs.filter((j) => j.recruiterId !== r.id),
      recruiters: prev.recruiters.filter((x) => x.id !== r.id),
    }));
  };

  const setMessageStatus = async (m: ContactMessage, status: ContactMessage["status"]) => {
    const json = await api(`/api/admin/messages/${m.id}`, "PATCH", { status });
    if (!json.success) return setNotice({ ok: false, text: json.message });
    setData((prev) => ({
      ...prev,
      messages: prev.messages.map((x) => (x.id === m.id ? { ...x, status } : x)),
    }));
  };

  const deleteMessage = async (m: ContactMessage) => {
    if (!confirm(`Delete this message from ${m.email}?`)) return;
    const json = await api(`/api/admin/messages/${m.id}`, "DELETE");
    setNotice({ ok: json.success, text: json.message });
    if (!json.success) return;
    setData((prev) => ({ ...prev, messages: prev.messages.filter((x) => x.id !== m.id) }));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const openMessages = data.messages.filter((m) => m.status === "open").length;
  const employers = data.recruiters.filter((r) => r.role === "recruiter");

  const tabs: { id: Tab; label: string; icon: typeof Briefcase; count?: number }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "jobs", label: "Jobs", icon: Briefcase, count: data.jobs.length },
    { id: "employers", label: "Employers", icon: Users, count: data.recruiters.length },
    { id: "messages", label: "Messages", icon: Inbox, count: openMessages },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-7 w-7 text-saffron" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">Signed in as {admin.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/api/admin/export" download>
            <Button>
              <Download className="h-4 w-4" />
              Download Excel
            </Button>
          </a>
          <Link href="/dashboard/post">
            <Button variant="secondary">Post a Job</Button>
          </Link>
          <Button variant="outline" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            className={cn(
              "mb-6 rounded-xl border px-4 py-3 text-sm",
              notice.ok
                ? "border-india-green/30 bg-india-green/10 text-foreground"
                : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
            )}
          >
            {notice.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6 overflow-x-auto">
        <div className="inline-flex rounded-xl border border-border bg-surface p-1">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                tab === id ? "bg-saffron text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs",
                    tab === id ? "bg-white/25" : "bg-muted"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" ? (
        <OverviewTab
          data={data}
          employers={employers}
          openMessages={openMessages}
          weekAgo={weekAgo}
          onTab={setTab}
        />
      ) : tab === "jobs" ? (
        <JobsTab jobs={data.jobs} recruiterById={recruiterById} onDelete={deleteJob} />
      ) : tab === "employers" ? (
        <EmployersTab
          recruiters={data.recruiters}
          jobs={data.jobs}
          selfId={admin.id}
          onUpdate={updateEmployer}
          onReset={sendReset}
          onDelete={deleteEmployer}
        />
      ) : (
        <MessagesTab
          messages={data.messages}
          onStatus={setMessageStatus}
          onDelete={deleteMessage}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/* Overview                                                            */
/* ================================================================== */

function OverviewTab({
  data,
  employers,
  openMessages,
  weekAgo,
  onTab,
}: {
  data: AdminOverview;
  employers: RecruiterSummary[];
  openMessages: number;
  weekAgo: number;
  onTab: (t: Tab) => void;
}) {
  const recent = (iso: string) => new Date(iso).getTime() > weekAgo;
  const stats = [
    { label: "Live jobs", value: data.jobs.length, sub: `${data.jobs.filter((j) => recent(j.createdAt)).length} this week`, icon: Briefcase, tab: "jobs" as Tab },
    { label: "Employers", value: employers.filter((r) => r.status === "active").length, sub: `${employers.filter((r) => recent(r.createdAt)).length} joined this week`, icon: Users, tab: "employers" as Tab },
    { label: "Suspended", value: employers.filter((r) => r.status === "suspended").length, sub: "employer accounts", icon: Ban, tab: "employers" as Tab },
    { label: "Open messages", value: openMessages, sub: `${data.messages.filter((m) => m.topic === "report" && m.status === "open").length} job reports`, icon: Inbox, tab: "messages" as Tab },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, tab }) => (
          <button key={label} onClick={() => onTab(tab)} className="text-left">
            <Card hover className="p-5 h-full">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{label}</p>
                <Icon className="h-4 w-4 text-saffron" />
              </div>
              <p className="text-3xl font-bold mt-2">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </Card>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarList title="Jobs by industry" items={countBy(data.jobs, (j) => j.industry)} />
        <BarList title="Jobs by location" items={countBy(data.jobs, (j) => j.location)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Latest jobs</h3>
          {data.jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No jobs yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.jobs.slice(0, 6).map((j) => (
                <li key={j.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{j.title}</span>
                    <span className="text-muted-foreground"> · {j.company}</span>
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">{fmtDate(j.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Newest employers</h3>
          {employers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employers yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {employers.slice(0, 6).map((r) => (
                <li key={r.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{r.name}</span>
                    <span className="text-muted-foreground"> · {r.company || r.email}</span>
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {r.jobCount} job{r.jobCount === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function countBy<T>(items: T[], key: (item: T) => string): [string, number][] {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

/** Single-series horizontal bar chart; every bar is directly labeled. */
function BarList({ title, items }: { title: string; items: [string, number][] }) {
  const max = Math.max(1, ...items.map(([, v]) => v));
  const total = items.reduce((sum, [, v]) => sum + v, 0);
  return (
    <Card className="p-5">
      <h3 className="font-semibold mb-4">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data yet.</p>
      ) : (
        <ul className="space-y-2" aria-label={title}>
          {items.map(([label, value]) => (
            <li
              key={label}
              className="group grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3 text-sm rounded-md -mx-1 px-1 py-0.5 hover:bg-muted/60"
              title={`${label}: ${value} job${value === 1 ? "" : "s"} (${Math.round((value / total) * 100)}%)`}
            >
              <span className="truncate text-muted-foreground group-hover:text-foreground">{label}</span>
              <span className="h-2.5 rounded-r bg-muted/50 overflow-hidden">
                <span
                  className="block h-full rounded-r bg-chart-bar"
                  style={{ width: `${(value / max) * 100}%` }}
                />
              </span>
              <span className="text-right tabular-nums font-medium">{value}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ================================================================== */
/* Jobs                                                                */
/* ================================================================== */

function JobsTab({
  jobs,
  recruiterById,
  onDelete,
}: {
  jobs: JobPosting[];
  recruiterById: Map<string, RecruiterSummary>;
  onDelete: (job: JobPosting) => void;
}) {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = jobs.filter((j) => {
    if (industry && j.industry !== industry) return false;
    if (location && j.location !== location) return false;
    if (!q) return true;
    const owner = recruiterById.get(j.recruiterId);
    return [j.title, j.company, j.description, j.contact.email, j.contact.phone, j.contact.name, owner?.email, owner?.name, ...j.tags]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <SearchBox value={query} onChange={setQuery} placeholder="Search title, company, contact, employer..." />
        <Select value={industry} onChange={setIndustry} label="All industries" options={industries} />
        <Select value={location} onChange={setLocation} label="All locations" options={locations} />
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        {filtered.length} of {jobs.length} jobs
      </p>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No jobs found.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => {
            const owner = recruiterById.get(job.recruiterId);
            const open = expanded === job.id;
            return (
              <Card key={job.id} className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <button
                    className="min-w-0 text-left flex-1"
                    onClick={() => setExpanded(open ? null : job.id)}
                    aria-expanded={open}
                  >
                    <h3 className="font-semibold flex items-center gap-2">
                      {job.title}
                      {owner?.status === "suspended" && <Badge variant="outline">Employer suspended</Badge>}
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {job.company} · {job.location} · {job.jobProfile} · posted {fmtDate(job.createdAt)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      Employer: {owner ? `${owner.name} (${owner.email})` : "unknown"}
                    </p>
                  </button>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/dashboard/jobs/${job.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </Link>
                    <Button variant="danger" size="sm" onClick={() => onDelete(job)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>

                {open && <JobDetails job={job} owner={owner} />}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function JobDetails({ job, owner }: { job: JobPosting; owner?: RecruiterSummary }) {
  return (
    <div className="mt-4 border-t border-border pt-4 grid grid-cols-1 lg:grid-cols-3 gap-6 text-sm">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="saffron">{job.industry}</Badge>
          <Badge variant="outline">{job.subRole}</Badge>
          {job.tags.map((t) => (
            <Badge key={t} variant="outline">{t}</Badge>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Description</p>
          <p className="whitespace-pre-wrap leading-relaxed">{job.description}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Criteria</p>
          <ul className="list-disc pl-5 space-y-0.5">
            {job.criteria.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
      <dl className="space-y-3">
        <Detail label="Contact name" value={job.contact.name} />
        <Detail
          label="Contact email"
          value={job.contact.email && (
            <a href={`mailto:${job.contact.email}`} className="text-saffron hover:underline inline-flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {job.contact.email}
            </a>
          )}
        />
        <Detail
          label="Contact phone"
          value={job.contact.phone && (
            <a href={`tel:${job.contact.phone}`} className="text-saffron hover:underline inline-flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {job.contact.phone}
            </a>
          )}
        />
        <Detail
          label="Attachment"
          value={job.attachmentUrl && (
            <a href={job.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-saffron hover:underline inline-flex items-center gap-1">
              <Paperclip className="h-3.5 w-3.5" />
              Open file
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        />
        <Detail label="Employer" value={owner ? `${owner.name} · ${owner.email}` : undefined} />
        <Detail label="Posted" value={fmtDateTime(job.createdAt)} />
        <Detail label="Last updated" value={fmtDateTime(job.updatedAt ?? job.createdAt)} />
        <Detail label="Job ID" value={<span className="font-mono text-xs break-all">{job.id}</span>} />
      </dl>
    </div>
  );
}

/* ================================================================== */
/* Employers                                                           */
/* ================================================================== */

function EmployersTab({
  recruiters,
  jobs,
  selfId,
  onUpdate,
  onReset,
  onDelete,
}: {
  recruiters: RecruiterSummary[];
  jobs: JobPosting[];
  selfId: string;
  onUpdate: (r: RecruiterSummary, patch: Partial<Pick<Recruiter, "status" | "role">>, confirmText: string) => void;
  onReset: (r: RecruiterSummary) => void;
  onDelete: (r: RecruiterSummary) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = recruiters.filter((r) => {
    if (filter === "active" && r.status !== "active") return false;
    if (filter === "suspended" && r.status !== "suspended") return false;
    if (filter === "admin" && r.role !== "admin") return false;
    if (filter === "recruiter" && r.role !== "recruiter") return false;
    return !q || [r.name, r.email, r.company].join(" ").toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <SearchBox value={query} onChange={setQuery} placeholder="Search name, email, company..." />
        <Select
          value={filter}
          onChange={setFilter}
          label="All accounts"
          options={["active", "suspended", "recruiter", "admin"]}
          optionLabels={{ active: "Active", suspended: "Suspended", recruiter: "Employers only", admin: "Admins only" }}
        />
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        {filtered.length} of {recruiters.length} accounts
      </p>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No accounts found.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded === r.id;
            const isSelf = r.id === selfId;
            const theirJobs = open ? jobs.filter((j) => j.recruiterId === r.id) : [];
            return (
              <Card key={r.id} className={cn("p-5", r.status === "suspended" && "opacity-75")}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <button
                    className="min-w-0 text-left flex-1"
                    onClick={() => setExpanded(open ? null : r.id)}
                    aria-expanded={open}
                  >
                    <h3 className="font-semibold flex flex-wrap items-center gap-2">
                      {r.name}
                      {r.role === "admin" && <Badge variant="green">Admin</Badge>}
                      {r.status === "suspended" && <Badge variant="outline">Suspended</Badge>}
                      {isSelf && <Badge variant="outline">You</Badge>}
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {r.email}
                      {r.company ? ` · ${r.company}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.jobCount} job{r.jobCount === 1 ? "" : "s"} · joined {fmtDate(r.createdAt)} · last login{" "}
                      {fmtDateTime(r.lastLoginAt)}
                    </p>
                  </button>

                  {!isSelf && (
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {r.status === "active" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onUpdate(r, { status: "suspended" },
                              `Suspend ${r.email}? They won't be able to sign in and their jobs will be hidden from the site.`)
                          }
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdate(r, { status: "active" }, `Reactivate ${r.email}? Their jobs will be visible again.`)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Reactivate
                        </Button>
                      )}
                      {r.role === "recruiter" && (
                        <Button variant="outline" size="sm" onClick={() => onReset(r)}>
                          <KeyRound className="h-3.5 w-3.5" />
                          Reset password
                        </Button>
                      )}
                      {r.role === "recruiter" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdate(r, { role: "admin" }, `Make ${r.email} an admin? They'll get full access to this panel.`)}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Make admin
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdate(r, { role: "recruiter" }, `Remove admin access from ${r.email}?`)}
                        >
                          <ShieldOff className="h-3.5 w-3.5" />
                          Remove admin
                        </Button>
                      )}
                      {r.role === "recruiter" && (
                        <Button variant="danger" size="sm" onClick={() => onDelete(r)}>
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {open && (
                  <div className="mt-4 border-t border-border pt-4 grid grid-cols-1 lg:grid-cols-3 gap-6 text-sm">
                    <dl className="space-y-3">
                      <Detail label="Email" value={<a href={`mailto:${r.email}`} className="text-saffron hover:underline">{r.email}</a>} />
                      <Detail label="Company" value={r.company} />
                      <Detail label="Role" value={r.role === "admin" ? "Admin" : "Employer"} />
                      <Detail label="Status" value={r.status === "active" ? "Active" : "Suspended"} />
                      <Detail label="Joined" value={fmtDateTime(r.createdAt)} />
                      <Detail label="Last login" value={fmtDateTime(r.lastLoginAt)} />
                      <Detail label="Account ID" value={<span className="font-mono text-xs break-all">{r.id}</span>} />
                    </dl>
                    <div className="lg:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Jobs posted ({theirJobs.length})
                      </p>
                      {theirJobs.length === 0 ? (
                        <p className="text-muted-foreground">No jobs posted.</p>
                      ) : (
                        <ul className="divide-y divide-border rounded-xl border border-border">
                          {theirJobs.map((j) => (
                            <li key={j.id} className="flex items-center justify-between gap-3 px-3 py-2">
                              <span className="min-w-0 truncate">
                                <span className="font-medium">{j.title}</span>
                                <span className="text-muted-foreground"> · {j.location} · {fmtDate(j.createdAt)}</span>
                              </span>
                              <Link href={`/dashboard/jobs/${j.id}/edit`} className="text-saffron text-xs hover:underline shrink-0">
                                Edit
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/* Messages                                                            */
/* ================================================================== */

function MessagesTab({
  messages,
  onStatus,
  onDelete,
}: {
  messages: ContactMessage[];
  onStatus: (m: ContactMessage, s: ContactMessage["status"]) => void;
  onDelete: (m: ContactMessage) => void;
}) {
  const [filter, setFilter] = useState("open");
  const filtered = messages.filter((m) => !filter || m.status === filter);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Select
          value={filter}
          onChange={setFilter}
          label="All messages"
          options={["open", "resolved"]}
          optionLabels={{ open: "Open", resolved: "Resolved" }}
        />
      </div>
      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          {filter === "open" ? "No open messages. 🎉" : "No messages."}
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <Card key={m.id} className={cn("p-5", m.status === "resolved" && "opacity-75")}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={m.topic === "report" ? "saffron" : "outline"}>{topicLabel(m.topic)}</Badge>
                    {m.status === "resolved" && <Badge variant="green">Resolved</Badge>}
                    <span className="text-xs text-muted-foreground">{fmtDateTime(m.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm">
                    <span className="font-medium">{m.name}</span>{" "}
                    <span className="text-muted-foreground">&lt;{m.email}&gt;</span>
                  </p>
                  <p className="mt-2 text-sm whitespace-pre-wrap leading-relaxed">{m.message}</p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${topicLabel(m.topic)} — Joblay`)}`}>
                    <Button variant="outline" size="sm">
                      <Mail className="h-3.5 w-3.5" />
                      Reply
                    </Button>
                  </a>
                  {m.status === "open" ? (
                    <Button variant="secondary" size="sm" onClick={() => onStatus(m, "resolved")}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Resolve
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => onStatus(m, "open")}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reopen
                    </Button>
                  )}
                  <Button variant="danger" size="sm" onClick={() => onDelete(m)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/* Small pieces                                                        */
/* ================================================================== */

function Detail({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value || <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
        className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/50 focus:border-saffron"
      />
    </div>
  );
}

function Select({
  value,
  onChange,
  label,
  options,
  optionLabels,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: readonly string[];
  optionLabels?: Record<string, string>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/50 focus:border-saffron"
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {optionLabels?.[o] ?? o}
        </option>
      ))}
    </select>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Flag,
  GraduationCap,
  IndianRupee,
  MapPin,
  Paperclip,
  Share2,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ContactActions } from "@/components/jobs/ContactActions";
import { JobCard, JobHighlights } from "@/components/jobs/JobCard";
import { CopyLinkButton, TrackJobView } from "@/components/jobs/JobPageExtras";
import { SaveJobButton } from "@/components/jobs/SaveJobButton";
import { getCurrentRecruiter } from "@/lib/auth/current";
import { emptyJobQuery, formatExperience, formatSalary, postedAgo } from "@/lib/jobQuery";
import { findRecruiterById, getJobById, isJobLive, searchJobs } from "@/lib/repository";
import { isPublicSiteUrl, siteUrl } from "@/lib/siteUrl";
import type { JobPosting } from "@/types";

type Params = Promise<{ id: string }>;

/** Loads a job if this viewer may see it (hidden if the employer is suspended). */
async function loadJob(id: string) {
  const job = await getJobById(id);
  if (!job) return null;
  const owner = await findRecruiterById(job.recruiterId);
  if (owner?.status === "suspended") {
    const viewer = await getCurrentRecruiter();
    if (viewer?.role !== "admin") return null;
  }
  return job;
}

/** Up to 4 other live jobs in the same role, topped up from the same industry. */
async function similarJobs(job: JobPosting): Promise<JobPosting[]> {
  try {
    const others = (jobs: JobPosting[]) => jobs.filter((j) => j.id !== job.id);
    const sameRole = others((await searchJobs({ ...emptyJobQuery, industry: [job.industry], subRole: [job.subRole] })).jobs);
    if (sameRole.length >= 4) return sameRole.slice(0, 4);
    const sameIndustry = others((await searchJobs({ ...emptyJobQuery, industry: [job.industry] })).jobs);
    const seen = new Set(sameRole.map((j) => j.id));
    return [...sameRole, ...sameIndustry.filter((j) => !seen.has(j.id))].slice(0, 4);
  } catch {
    return []; // a nice-to-have; never break the job page
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const job = await loadJob((await params).id);
  if (!job) return { title: "Job not found" };
  return {
    title: `${job.title} at ${job.company}, ${job.location}`,
    description: `${job.title} · ${formatExperience(job.experienceMin, job.experienceMax)} · ${formatSalary(job.salaryMin, job.salaryMax)} · ${job.workMode}. ${job.description.slice(0, 140)}`,
    robots: isJobLive(job) ? undefined : { index: false },
  };
}

export default async function JobPage({ params }: { params: Params }) {
  const job = await loadJob((await params).id);
  if (!job) notFound();

  const h = await headers();
  const origin = isPublicSiteUrl()
    ? siteUrl()
    : `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const url = `${origin}/jobs/${job.id}`;
  // eslint-disable-next-line react-hooks/purity -- request time
  const now = Date.now();
  const live = isJobLive(job, now);
  const similar = await similarJobs(job);
  const share = `https://wa.me/?text=${encodeURIComponent(`${job.title} at ${job.company} (${job.location}) — ${url}`)}`;

  const facts = [
    { icon: Briefcase, label: "Experience", value: formatExperience(job.experienceMin, job.experienceMax) },
    { icon: IndianRupee, label: "Salary", value: formatSalary(job.salaryMin, job.salaryMax) },
    { icon: MapPin, label: "Location", value: `${job.location} · ${job.workMode}` },
    { icon: GraduationCap, label: "Education", value: job.education },
    { icon: Users, label: "Openings", value: String(job.openings) },
    { icon: Calendar, label: "Posted", value: postedAgo(job.createdAt, now) },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {live && (
        <script
          type="application/ld+json"
          // Escape "<" so the JSON can't close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd(job)).replace(/</g, "\\u003c") }}
        />
      )}

      {live && <TrackJobView jobId={job.id} />}

      <div className="flex items-center justify-between gap-3 mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          All jobs
        </Link>
        {live && <SaveJobButton jobId={job.id} withLabel />}
      </div>

      {!live && (
        <div className="mb-6 rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm">
          This job is no longer accepting applications.{" "}
          <Link href="/" className="font-medium text-saffron-dark dark:text-saffron hover:underline">
            Browse open jobs
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-6">
        <div className="space-y-6 min-w-0">
          <div>
            <div className="flex flex-wrap gap-1.5 empty:hidden mb-2">
              <JobHighlights job={job} now={now} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{job.title}</h1>
            <p className="mt-1 text-lg text-muted-foreground">{job.company}</p>
            <div className="flex flex-wrap gap-1.5 mt-4">
              <Badge variant="saffron">{job.workMode}</Badge>
              <Badge variant="green">{job.jobType}</Badge>
              <Badge variant="outline">{job.jobProfile}</Badge>
              <Badge variant="outline">{job.industry}</Badge>
              <Badge variant="outline">{job.subRole}</Badge>
            </div>
          </div>

          <Card className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </p>
                <p className="mt-0.5 font-medium text-sm">{value}</p>
              </div>
            ))}
          </Card>

          <section>
            <h2 className="font-semibold text-lg mb-2">About the role</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{job.description}</p>
          </section>

          {job.criteria.length > 0 && (
            <section>
              <h2 className="font-semibold text-lg mb-2">Requirements</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                {job.criteria.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="font-semibold text-lg mb-2">Skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {job.tags.map((t) => (
                <Link key={t} href={`/?tags=${encodeURIComponent(t)}&industry=${encodeURIComponent(job.industry)}&subRole=${encodeURIComponent(job.subRole)}`}>
                  <Badge variant="outline" className="hover:border-saffron">
                    {t}
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <Card className="p-5 lg:sticky lg:top-20">
            <h2 className="font-semibold mb-1">Contact the recruiter</h2>
            {job.contact.name && <p className="text-sm text-muted-foreground mb-3">{job.contact.name}</p>}
            {live ? (
              <ContactActions jobId={job.id} contact={job.contact} jobTitle={job.title} />
            ) : (
              <p className="text-sm text-muted-foreground">Contact details are hidden for closed jobs.</p>
            )}
            {job.attachmentUrl && (
              <a
                href={job.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-2 text-sm font-medium text-saffron-dark dark:text-saffron hover:underline"
              >
                <Paperclip className="h-4 w-4" />
                Download full JD
              </a>
            )}
            <div className="mt-5 pt-4 border-t border-border flex flex-col gap-2 text-sm">
              <a href={share} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <Share2 className="h-4 w-4" />
                Share on WhatsApp
              </a>
              <CopyLinkButton url={url} />
              <Link href={`/contact?topic=report&job=${job.id}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <Flag className="h-4 w-4" />
                Report this job
              </Link>
            </div>
          </Card>
          <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold">Stay safe</p>
              <p className="mt-0.5 text-muted-foreground">
                Joblay never charges candidates. Never pay anyone for a job, training or &ldquo;registration&rdquo;.{" "}
                <Link href="/safety" className="font-medium text-foreground underline underline-offset-2">
                  Safety tips
                </Link>
              </p>
            </div>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="font-semibold text-xl mb-4">Similar jobs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {similar.map((j) => (
              <JobCard key={j.id} job={j} now={now} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const EMPLOYMENT_TYPE: Record<string, string> = {
  "Full-time": "FULL_TIME",
  "Part-time": "PART_TIME",
  Contract: "CONTRACTOR",
  Freelance: "CONTRACTOR",
  Internship: "INTERN",
  Temporary: "TEMPORARY",
};

/** schema.org JobPosting for Google for Jobs. */
function jobPostingJsonLd(job: JobPosting) {
  const description = [
    `<p>${escapeHtml(job.description).replace(/\n/g, "<br>")}</p>`,
    job.criteria.length ? `<ul>${job.criteria.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>` : "",
  ].join("");

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description,
    identifier: { "@type": "PropertyValue", name: "Joblay", value: job.id },
    datePosted: job.createdAt,
    validThrough: job.expiresAt,
    employmentType: EMPLOYMENT_TYPE[job.jobType] ?? "OTHER",
    hiringOrganization: { "@type": "Organization", name: job.company },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...(job.location !== "Pan India" && { addressLocality: job.location }),
        addressCountry: "IN",
      },
    },
    ...(job.workMode === "Remote" && {
      jobLocationType: "TELECOMMUTE",
      applicantLocationRequirements: { "@type": "Country", name: "India" },
    }),
    ...(job.salaryMin !== undefined &&
      job.salaryMax !== undefined && {
        baseSalary: {
          "@type": "MonetaryAmount",
          currency: "INR",
          value: {
            "@type": "QuantitativeValue",
            minValue: Math.round(job.salaryMin * 100_000),
            maxValue: Math.round(job.salaryMax * 100_000),
            unitText: "YEAR",
          },
        },
      }),
    experienceRequirements: {
      "@type": "OccupationalExperienceRequirements",
      monthsOfExperience: job.experienceMin * 12,
    },
    totalJobOpenings: job.openings,
    skills: job.tags.join(", "),
    directApply: false,
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

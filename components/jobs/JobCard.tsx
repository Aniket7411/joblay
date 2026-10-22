import Link from "next/link";
import { Briefcase, Clock, IndianRupee, MapPin, Paperclip, Users, Zap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ContactActions } from "@/components/jobs/ContactActions";
import { SaveJobButton } from "@/components/jobs/SaveJobButton";
import { formatExperience, formatSalary, postedAgo } from "@/lib/jobQuery";
import { cn } from "@/lib/utils";
import type { JobPosting } from "@/types";

/** Jobs posted within this many days get a "New" badge. */
const NEW_DAYS = 2;

/** "New" / "Urgent" badges, shared by the card and the job page. */
export function JobHighlights({ job, now }: { job: JobPosting; now: number }) {
  const isNew = now - new Date(job.createdAt).getTime() < NEW_DAYS * 86_400_000;
  if (!isNew && !job.urgent) return null;
  return (
    <>
      {job.urgent && (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
          <Zap className="h-3 w-3 fill-current" />
          Urgent
        </span>
      )}
      {isNew && (
        <span className="inline-flex items-center rounded-full bg-india-green/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-india-green-dark dark:text-india-green">
          New
        </span>
      )}
    </>
  );
}

/**
 * A job in the results. `compact` (two cards per row on phones) trims the
 * card below the sm breakpoint to the essentials; wider screens always get
 * the full card.
 */
export function JobCard({ job, now, compact = false }: { job: JobPosting; now: number; compact?: boolean }) {
  // Hidden on phones in compact mode.
  const full = compact ? "max-sm:hidden" : "";
  return (
    <Card hover className={cn("h-full flex flex-col p-5 sm:p-6", compact && "max-sm:p-3")}>
      <div className={cn("flex items-start justify-between gap-3", compact && "max-sm:gap-1.5")}>
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5 empty:hidden mb-1.5">
            <JobHighlights job={job} now={now} />
          </div>
          <h3 className={cn("font-semibold text-lg leading-snug", compact && "max-sm:text-sm max-sm:line-clamp-2")}>
            <Link href={`/jobs/${job.id}`} className="hover:text-saffron-dark dark:hover:text-saffron">
              {job.title}
            </Link>
          </h3>
          <p className={cn("text-sm text-muted-foreground mt-0.5", compact && "max-sm:text-xs max-sm:truncate")}>
            {job.company}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className={cn("text-xs text-muted-foreground flex items-center gap-1", full)}>
            <Clock className="h-3 w-3" />
            {postedAgo(job.createdAt, now)}
          </span>
          <SaveJobButton jobId={job.id} className={cn(compact && "max-sm:h-7 max-sm:w-7")} />
        </div>
      </div>

      <ul
        className={cn(
          "mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground",
          compact && "max-sm:mt-2 max-sm:flex-col max-sm:gap-1 max-sm:text-xs"
        )}
      >
        <li className="flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5" />
          {formatExperience(job.experienceMin, job.experienceMax)}
        </li>
        <li className="flex items-center gap-1.5">
          <IndianRupee className="h-3.5 w-3.5" />
          {formatSalary(job.salaryMin, job.salaryMax)}
        </li>
        <li className="flex items-center gap-1.5 min-w-0">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{job.location}</span>
        </li>
        {job.openings > 1 && (
          <li className={cn("flex items-center gap-1.5", full)}>
            <Users className="h-3.5 w-3.5" />
            {job.openings} openings
          </li>
        )}
      </ul>

      <div className={cn("flex flex-wrap gap-1.5 mt-3", full)}>
        <Badge variant="saffron">{job.workMode}</Badge>
        <Badge variant="green">{job.jobType}</Badge>
        <Badge variant="outline">{job.jobProfile}</Badge>
        {job.tags.slice(0, 4).map((tag) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
        {job.tags.length > 4 && <Badge variant="outline">+{job.tags.length - 4}</Badge>}
      </div>

      <p className={cn("text-sm text-muted-foreground line-clamp-2 mt-3 flex-1", full)}>{job.description}</p>

      {compact && (
        <div className="sm:hidden mt-auto pt-2.5">
          <p className="mb-2.5 text-[11px] font-medium text-muted-foreground truncate">
            {job.workMode} · {job.jobType}
          </p>
          <Link
            href={`/jobs/${job.id}`}
            className="block rounded-lg bg-saffron/10 py-2 text-center text-xs font-semibold text-saffron-dark dark:text-saffron active:bg-saffron/20"
          >
            View job
          </Link>
        </div>
      )}

      <div className={cn("flex items-center justify-between gap-3 mt-3 mb-4 text-xs", full)}>
        <Link href={`/jobs/${job.id}`} className="font-medium text-saffron-dark dark:text-saffron hover:underline">
          View details →
        </Link>
        {job.attachmentUrl && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Paperclip className="h-3 w-3" />
            JD attached
          </span>
        )}
      </div>

      <div className={full}>
        <ContactActions jobId={job.id} contact={job.contact} jobTitle={job.title} />
      </div>
    </Card>
  );
}

import Link from "next/link";
import { Briefcase, Clock, IndianRupee, MapPin, Paperclip, Users, Zap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ContactActions } from "@/components/jobs/ContactActions";
import { SaveJobButton } from "@/components/jobs/SaveJobButton";
import { formatExperience, formatSalary, postedAgo } from "@/lib/jobQuery";
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

export function JobCard({ job, now }: { job: JobPosting; now: number }) {
  return (
    <Card hover className="h-full flex flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5 empty:hidden mb-1.5">
            <JobHighlights job={job} now={now} />
          </div>
          <h3 className="font-semibold text-lg leading-snug">
            <Link href={`/jobs/${job.id}`} className="hover:text-saffron-dark dark:hover:text-saffron">
              {job.title}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">{job.company}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {postedAgo(job.createdAt, now)}
          </span>
          <SaveJobButton jobId={job.id} />
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5" />
          {formatExperience(job.experienceMin, job.experienceMax)}
        </li>
        <li className="flex items-center gap-1.5">
          <IndianRupee className="h-3.5 w-3.5" />
          {formatSalary(job.salaryMin, job.salaryMax)}
        </li>
        <li className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {job.location}
        </li>
        {job.openings > 1 && (
          <li className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {job.openings} openings
          </li>
        )}
      </ul>

      <div className="flex flex-wrap gap-1.5 mt-3">
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

      <p className="text-sm text-muted-foreground line-clamp-2 mt-3 flex-1">{job.description}</p>

      <div className="flex items-center justify-between gap-3 mt-3 mb-4 text-xs">
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

      <ContactActions jobId={job.id} contact={job.contact} jobTitle={job.title} />
    </Card>
  );
}

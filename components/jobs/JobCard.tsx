import Link from "next/link";
import { Briefcase, Clock, IndianRupee, MapPin, Paperclip, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ContactActions } from "@/components/jobs/ContactActions";
import { formatExperience, formatSalary, postedAgo } from "@/lib/jobQuery";
import type { JobPosting } from "@/types";

export function JobCard({ job, now }: { job: JobPosting; now: number }) {
  return (
    <Card hover className="h-full flex flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-lg leading-snug">
            <Link href={`/jobs/${job.id}`} className="hover:text-saffron-dark dark:hover:text-saffron">
              {job.title}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">{job.company}</p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {postedAgo(job.createdAt, now)}
        </span>
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

      <ContactActions contact={job.contact} jobTitle={job.title} />
    </Card>
  );
}

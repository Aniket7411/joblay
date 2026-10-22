"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CheckCircle2, Paperclip, Send, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { useFetch } from "@/hooks/useFetch";
import {
  educationLevels,
  getNicheTags,
  getSubRoles,
  jobProfiles,
  jobTypes,
  locations,
  MAX_EXPERIENCE_YEARS,
  workModes,
  type Taxonomy,
} from "@/lib/data/filterHierarchy";

const experienceOptions = Array.from({ length: MAX_EXPERIENCE_YEARS + 1 }, (_, i) => String(i));
const experienceLabels: Record<string, string> = Object.fromEntries(
  experienceOptions.map((y) => [y, y === "0" ? "0 (Fresher)" : `${y} year${y === "1" ? "" : "s"}`])
);

const createDefaults: Partial<JobPostFormData> = {
  tags: [],
  workMode: "Office",
  jobType: "Full-time",
  education: "Any",
  experienceMin: "0",
  experienceMax: String(MAX_EXPERIENCE_YEARS),
  openings: "1",
  urgent: false,
};
import { jobPostSchema, type JobPostFormData } from "@/lib/validations";
import { cn } from "@/lib/utils";

interface JobPostFormProps {
  /** Industries → roles → skills, including admin additions. */
  taxonomy: Taxonomy;
  uploadsEnabled?: boolean;
  /** Edit mode: the job being edited and its current values. */
  jobId?: string;
  initialValues?: Partial<JobPostFormData>;
  /** Where to go after saving (defaults to the dashboard). */
  redirectTo?: string;
  /** Show "paste a JD → auto-fill" (Gemini configured on the server). */
  aiEnabled?: boolean;
}

export function JobPostForm({
  taxonomy,
  uploadsEnabled = false,
  jobId,
  initialValues,
  redirectTo = "/dashboard",
  aiEnabled = false,
}: JobPostFormProps) {
  const router = useRouter();
  const isEdit = Boolean(jobId);
  const { execute, loading, error } = useFetch();
  const [selectedTags, setSelectedTags] = useState<string[]>(initialValues?.tags ?? []);
  const [success, setSuccess] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; url: string } | null>(
    initialValues?.attachmentUrl
      ? { name: "Current attachment", url: initialValues.attachmentUrl }
      : null
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<JobPostFormData>({
    resolver: zodResolver(jobPostSchema),
    defaultValues: initialValues ?? createDefaults,
  });

  const industry = watch("industry");
  const subRole = watch("subRole");

  // The sub-role <select> only has options once the industry is applied, so
  // an AI-suggested sub-role is set on the render after.
  const [pendingSubRole, setPendingSubRole] = useState<string | null>(null);
  useEffect(() => {
    if (pendingSubRole && getSubRoles(industry, taxonomy).includes(pendingSubRole)) {
      setValue("subRole", pendingSubRole);
      setPendingSubRole(null);
    }
  }, [industry, pendingSubRole, setValue, taxonomy]);

  const applyAiFields = (fields: Partial<JobPostFormData>) => {
    const { subRole: aiSubRole, tags, ...rest } = fields;
    reset({ ...getValues(), ...rest, subRole: "" }, { keepDefaultValues: true });
    setSelectedTags(tags ?? []);
    setPendingSubRole(aiSubRole ?? null);
  };
  const subRoles = getSubRoles(industry, taxonomy);
  const nicheTags = getNicheTags(industry, subRole, taxonomy);

  useEffect(() => {
    setValue("tags", selectedTags);
  }, [selectedTags, setValue]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File must be 5 MB or smaller");
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setAttachment({ name: file.name, url: json.data.url });
      setValue("attachmentUrl", json.data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setValue("attachmentUrl", "");
  };

  const onSubmit = async (data: JobPostFormData) => {
    const result = await execute(isEdit ? `/api/jobs/${jobId}` : "/api/jobs", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push(redirectTo);
        router.refresh();
      }, 1200);
    }
  };

  if (success) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="h-16 w-16 text-india-green mx-auto mb-4" />
        <h3 className="text-xl font-semibold">
          {isEdit ? "Changes Saved!" : "Job Posted!"}
        </h3>
        <p className="text-muted-foreground mt-2">Redirecting...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      {aiEnabled && <AiFillPanel onFill={applyAiFields} />}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            {...register("title")}
            label="Job Title"
            placeholder="e.g. Senior Java Developer"
            error={errors.title?.message}
          />
          <Input
            {...register("company")}
            label="Company"
            placeholder="Company name"
            error={errors.company?.message}
          />
        </div>

        <SectionTitle>Role</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <SelectField
            label="Industry"
            error={errors.industry?.message}
            options={Object.keys(taxonomy)}
            {...register("industry", {
              onChange: () => {
                setValue("subRole", "");
                setSelectedTags([]);
              },
            })}
          />
          <SelectField
            label="Role / Department"
            error={errors.subRole?.message}
            options={subRoles}
            disabled={subRoles.length === 0}
            placeholder={subRoles.length ? undefined : "Select industry first"}
            {...register("subRole", {
              onChange: () => setSelectedTags([]),
            })}
          />
          <SelectField
            label="Seniority"
            error={errors.jobProfile?.message}
            options={jobProfiles}
            {...register("jobProfile")}
          />
        </div>

        {nicheTags.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Skills <span className="font-normal text-muted-foreground">(pick all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {nicheTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={selectedTags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                    selectedTags.includes(tag)
                      ? "bg-india-green text-white border-india-green"
                      : "bg-surface border-border text-muted-foreground hover:border-saffron/40"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
            {errors.tags?.message && (
              <p className="text-xs text-red-500">{errors.tags.message}</p>
            )}
          </div>
        )}

        <SectionTitle>Location & type</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          <div className="col-span-2 sm:col-span-1">
            <SelectField
              label="Location"
              error={errors.location?.message}
              options={locations}
              {...register("location")}
            />
          </div>
          <SelectField
            label="Work mode"
            error={errors.workMode?.message}
            options={workModes}
            {...register("workMode")}
          />
          <SelectField
            label="Job type"
            error={errors.jobType?.message}
            options={jobTypes}
            {...register("jobType")}
          />
          <Input
            {...register("openings")}
            type="number"
            min={1}
            inputMode="numeric"
            label="Openings"
            error={errors.openings?.message}
          />
        </div>

        <SectionTitle>Experience, salary & education</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          <SelectField
            label="Min experience"
            error={errors.experienceMin?.message}
            options={experienceOptions}
            labels={experienceLabels}
            {...register("experienceMin")}
          />
          <SelectField
            label="Max experience"
            error={errors.experienceMax?.message}
            options={experienceOptions}
            labels={{ ...experienceLabels, "30": "30+ (no limit)" }}
            {...register("experienceMax")}
          />
          <Input
            {...register("salaryMin")}
            inputMode="decimal"
            label="Min salary (LPA)"
            placeholder="e.g. 4"
            error={errors.salaryMin?.message}
          />
          <Input
            {...register("salaryMax")}
            inputMode="decimal"
            label="Max salary (LPA)"
            placeholder="e.g. 6.5"
            error={errors.salaryMax?.message}
          />
        </div>
        <p className="-mt-3 text-xs text-muted-foreground">
          Salary in lakhs per annum. Leave blank to show &ldquo;Not disclosed&rdquo; — jobs with a salary get more responses.
        </p>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-3">
          <input
            type="checkbox"
            {...register("urgent")}
            className="mt-0.5 h-4 w-4 rounded border-border accent-[var(--saffron)]"
          />
          <span className="text-sm">
            <span className="font-medium">Urgent hiring</span>
            <span className="block text-xs text-muted-foreground">
              Shows an &ldquo;Urgent&rdquo; badge on the job. Use it only if you&apos;re hiring within days.
            </span>
          </span>
        </label>
        <div className="sm:w-1/2">
          <SelectField
            label="Minimum education"
            error={errors.education?.message}
            options={educationLevels}
            {...register("education")}
          />
        </div>

        <SectionTitle>Description</SectionTitle>

        <Textarea
          {...register("description")}
          label="Job Description"
          placeholder="Describe the role, team, and responsibilities..."
          error={errors.description?.message}
        />

        <Textarea
          {...register("criteria")}
          label="Criteria (one per line)"
          placeholder={"5+ years experience\nStrong communication\n..."}
          error={errors.criteria?.message}
        />

        {uploadsEnabled && (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">
              JD Attachment (optional)
            </label>
            {attachment ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 truncate hover:underline"
                >
                  <Paperclip className="h-4 w-4 shrink-0 text-saffron" />
                  <span className="truncate">{attachment.name}</span>
                </a>
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Remove attachment"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 py-3 text-sm text-muted-foreground hover:border-saffron/40",
                  uploading && "pointer-events-none opacity-60"
                )}
              >
                <Paperclip className="h-4 w-4" />
                {uploading ? "Uploading..." : "Upload PDF or Word document (max 5 MB)"}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="sr-only"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>
            )}
            {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
          </div>
        )}

        <div className="border-t border-border pt-5">
          <h3 className="font-semibold mb-1">Recruiter Contact</h3>
          <p className="text-xs text-muted-foreground mb-4">
            At least one of Name, Email, or Phone is required.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Input
              {...register("contactName")}
              label="Name"
              placeholder="Recruiter name"
              error={errors.contactName?.message}
            />
            <Input
              {...register("contactEmail")}
              type="email"
              label="Email"
              placeholder="recruiter@company.com"
              error={errors.contactEmail?.message}
            />
            <Input
              {...register("contactPhone")}
              label="Phone"
              placeholder="+91 98765 43210"
              error={errors.contactPhone?.message}
            />
          </div>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-red-500"
            role="alert"
          >
            {error}
          </motion.p>
        )}

        <Button
          type="submit"
          loading={loading}
          disabled={uploading}
          className="w-full sm:w-auto"
        >
          <Send className="h-4 w-4" />
          {isEdit ? "Save Changes" : "Post Job"}
        </Button>
      </form>
    </Card>
  );
}

function SelectField({
  label,
  error,
  options,
  labels,
  placeholder,
  ...props
}: {
  label: string;
  error?: string;
  options: readonly string[];
  /** Display text per option value. */
  labels?: Record<string, string>;
  placeholder?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = props.id ?? props.name;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <select
        {...props}
        id={id}
        className={cn(
          "w-full rounded-xl border bg-surface px-4 py-3 text-sm transition-colors disabled:opacity-60",
          "focus:outline-none focus:ring-2 focus:ring-saffron/50 focus:border-saffron",
          error ? "border-red-500" : "border-border hover:border-saffron/40"
        )}
      >
        <option value="">{placeholder ?? `Select ${label.toLowerCase()}`}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {labels?.[opt] ?? opt}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-t border-border pt-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  );
}

function AiFillPanel({ onFill }: { onFill: (fields: Partial<JobPostFormData>) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/ai/parse-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!json.success) {
        const fieldError = json.errors?.text?.[0];
        setStatus({ ok: false, message: fieldError || json.message });
        return;
      }
      onFill(json.data);
      const filled = Object.keys(json.data).length;
      setStatus({ ok: true, message: `Filled ${filled} fields. Please check everything below before posting.` });
      setOpen(false);
    } catch {
      setStatus({ ok: false, message: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-saffron/30 bg-saffron/5 p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left text-sm font-semibold"
      >
        <Sparkles className="h-4 w-4 text-saffron" />
        Already have a job description? Paste it and we&apos;ll fill the form
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the full JD here — title, responsibilities, requirements, salary, location, contact..."
            className="min-h-[180px]"
            aria-label="Job description to auto-fill from"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={run} loading={busy} disabled={text.trim().length < 80}>
              <Sparkles className="h-4 w-4" />
              Auto-fill with AI
            </Button>
            <p className="text-xs text-muted-foreground">
              Sent to Google Gemini to read. Don&apos;t include anything confidential.
            </p>
          </div>
        </div>
      )}
      {status && (
        <p className={cn("mt-3 text-sm", status.ok ? "text-india-green" : "text-red-500")} role="status">
          {status.message}
        </p>
      )}
    </div>
  );
}

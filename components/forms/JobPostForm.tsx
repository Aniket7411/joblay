"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CheckCircle2, Paperclip, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { useFetch } from "@/hooks/useFetch";
import {
  getNicheTags,
  getSubRoles,
  industries,
  jobProfiles,
  locations,
} from "@/lib/data/filterHierarchy";
import { jobPostSchema, type JobPostFormData } from "@/lib/validations";
import { cn } from "@/lib/utils";

export function JobPostForm({ uploadsEnabled = false }: { uploadsEnabled?: boolean }) {
  const router = useRouter();
  const { execute, loading, error } = useFetch();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; url: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<JobPostFormData>({
    resolver: zodResolver(jobPostSchema),
    defaultValues: { tags: [] },
  });

  const industry = watch("industry");
  const subRole = watch("subRole");
  const subRoles = getSubRoles(industry);
  const nicheTags = getNicheTags(industry, subRole);

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
    const result = await execute("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    }
  };

  if (success) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="h-16 w-16 text-india-green mx-auto mb-4" />
        <h3 className="text-xl font-semibold">Job Posted!</h3>
        <p className="text-muted-foreground mt-2">Redirecting to dashboard...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <SelectField
            label="Location"
            error={errors.location?.message}
            options={locations}
            {...register("location")}
          />
          <SelectField
            label="Job Profile"
            error={errors.jobProfile?.message}
            options={jobProfiles}
            {...register("jobProfile")}
          />
          <SelectField
            label="Industry"
            error={errors.industry?.message}
            options={industries}
            {...register("industry", {
              onChange: () => {
                setValue("subRole", "");
                setSelectedTags([]);
              },
            })}
          />
        </div>

        {subRoles.length > 0 && (
          <SelectField
            label="Sub-role"
            error={errors.subRole?.message}
            options={subRoles}
            {...register("subRole", {
              onChange: () => setSelectedTags([]),
            })}
          />
        )}

        {nicheTags.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Niche Tags</label>
            <div className="flex flex-wrap gap-2">
              {nicheTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
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
          Post Job
        </Button>
      </form>
    </Card>
  );
}

function SelectField({
  label,
  error,
  options,
  ...props
}: {
  label: string;
  error?: string;
  options: readonly string[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">{label}</label>
      <select
        {...props}
        className={cn(
          "w-full rounded-xl border bg-surface px-4 py-3 text-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-saffron/50 focus:border-saffron",
          error ? "border-red-500" : "border-border hover:border-saffron/40"
        )}
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

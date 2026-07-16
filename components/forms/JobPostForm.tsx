"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CheckCircle2, Plus, Send } from "lucide-react";
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

export function JobPostForm() {
  const router = useRouter();
  const { execute, loading, error } = useFetch();
  const [recruiterId, setRecruiterId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

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
    const stored = localStorage.getItem("bharat_recruiter");
    if (!stored) {
      router.push("/login");
      return;
    }
    const recruiter = JSON.parse(stored) as { id: string };
    setRecruiterId(recruiter.id);
  }, [router]);

  useEffect(() => {
    setValue("tags", selectedTags);
  }, [selectedTags, setValue]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const onSubmit = async (data: JobPostFormData) => {
    if (!recruiterId) return;
    const result = await execute("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, recruiterId }),
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

        <Button type="submit" loading={loading} className="w-full sm:w-auto">
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

import { z } from "zod";
import { educationLevels, jobTypes, workModes } from "@/lib/data/filterHierarchy";

const contactFields = z.object({
  contactName: z.string().max(80).optional().or(z.literal("")),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  contactPhone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .max(15)
    .optional()
    .or(z.literal("")),
});

const yearsField = z.string().regex(/^\d{1,2}$/, "Select experience");
const lpaField = z
  .string()
  .regex(/^\d{0,3}(\.\d{1,2})?$/, "Enter salary in LPA, e.g. 4.5")
  .optional()
  .or(z.literal(""));

export const jobPostSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters").max(120),
    company: z.string().min(2, "Company is required").max(80),
    location: z.string().min(1, "Location is required"),
    jobProfile: z.string().min(1, "Seniority is required"),
    industry: z.string().min(1, "Industry is required"),
    subRole: z.string().min(1, "Sub-role is required"),
    tags: z.array(z.string()).min(1, "Select at least one skill"),
    workMode: z.enum(workModes, { message: "Select work mode" }),
    jobType: z.enum(jobTypes, { message: "Select job type" }),
    education: z.enum(educationLevels, { message: "Select education" }),
    experienceMin: yearsField,
    experienceMax: yearsField,
    salaryMin: lpaField,
    salaryMax: lpaField,
    openings: z.string().regex(/^[1-9]\d{0,3}$/, "Enter number of openings"),
    description: z
      .string()
      .min(20, "Description must be at least 20 characters")
      .max(5000),
    criteria: z
      .string()
      .min(3, "Add at least one requirement")
      .max(2000),
    attachmentUrl: z.string().url().max(500).optional().or(z.literal("")),
    ...contactFields.shape,
  })
  .refine(
    (data) =>
      Boolean(
        data.contactName?.trim() ||
          data.contactEmail?.trim() ||
          data.contactPhone?.trim()
      ),
    {
      message: "At least one contact field (Name, Email, or Phone) is required",
      path: ["contactName"],
    }
  )
  .refine((d) => Number(d.experienceMax) >= Number(d.experienceMin), {
    message: "Max experience must be at least the minimum",
    path: ["experienceMax"],
  })
  .refine((d) => !d.salaryMax || Boolean(d.salaryMin), {
    message: "Enter the minimum salary too",
    path: ["salaryMin"],
  })
  .refine((d) => !d.salaryMin || !d.salaryMax || Number(d.salaryMax) >= Number(d.salaryMin), {
    message: "Max salary must be at least the minimum",
    path: ["salaryMax"],
  });

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be under 128 characters"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(80, "Name must be under 80 characters"),
    company: z.string().max(80).optional().or(z.literal("")),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must include uppercase, lowercase, and a number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must include uppercase, lowercase, and a number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type JobPostFormData = z.infer<typeof jobPostSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const contactTopics = [
  { value: "general", label: "General question" },
  { value: "report", label: "Report a job listing" },
  { value: "recruiter", label: "Recruiter support" },
  { value: "privacy", label: "Privacy / data request" },
] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().email("Please enter a valid email address"),
  topic: z.enum(["general", "report", "recruiter", "privacy"]),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(3000, "Message must be under 3000 characters"),
  // Honeypot — real users never fill this in.
  website: z.string().max(200).optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

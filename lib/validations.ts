import { z } from "zod";

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

export const jobPostSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters").max(120),
    company: z.string().min(2, "Company is required").max(80),
    location: z.string().min(1, "Location is required"),
    jobProfile: z.string().min(1, "Job profile is required"),
    industry: z.string().min(1, "Industry is required"),
    subRole: z.string().min(1, "Sub-role is required"),
    tags: z.array(z.string()).min(1, "Select at least one tag"),
    description: z
      .string()
      .min(20, "Description must be at least 20 characters")
      .max(3000),
    criteria: z
      .string()
      .min(10, "Add at least one criterion")
      .max(2000),
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
  );

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

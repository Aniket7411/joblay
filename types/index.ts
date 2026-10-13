export interface RecruiterContact {
  name?: string;
  email?: string;
  phone?: string;
}

export interface JobPosting {
  id: string;
  recruiterId: string;
  title: string;
  company: string;
  location: string;
  jobProfile: string;
  industry: string;
  subRole: string;
  tags: string[];
  description: string;
  criteria: string[];
  contact: RecruiterContact;
  attachmentUrl?: string;
  createdAt: string;
}

export type UserRole = "recruiter" | "admin";

export interface Recruiter {
  id: string;
  name: string;
  email: string;
  company?: string;
  role: UserRole;
  createdAt: string;
}

export interface RecruiterSummary extends Recruiter {
  jobCount: number;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends AuthPayload {
  name: string;
  company?: string;
  confirmPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface JobFilters {
  location: string;
  jobProfile: string;
  industry: string;
  subRole: string;
  tags: string[];
  search: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

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
  workMode: string;
  jobType: string;
  experienceMin: number;
  experienceMax: number;
  /** Lakhs per annum; both undefined when not disclosed. */
  salaryMin?: number;
  salaryMax?: number;
  education: string;
  openings: number;
  /** Recruiter flagged it "Urgent hiring". */
  urgent?: boolean;
  status: JobStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt?: string;
}

export type JobStatus = "active" | "closed";

export type UserRole = "recruiter" | "admin";
export type AccountStatus = "active" | "suspended";

export interface Recruiter {
  id: string;
  name: string;
  email: string;
  company?: string;
  role: UserRole;
  status: AccountStatus;
  lastLoginAt?: string;
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

export interface JobPage {
  jobs: JobPosting[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: "open" | "resolved";
  createdAt: string;
}

/** Per-job engagement, shown on the recruiter dashboard. */
export interface JobStats {
  views: number;
  contacts: number;
}

/** The admin-controlled "bulk hiring" popup shown to visitors. */
export interface BulkHiringPopup {
  enabled: boolean;
  title: string;
  message: string;
  /** Seconds after a page opens before it appears. */
  delaySeconds: number;
  updatedAt?: string;
}

export interface AdminOverview {
  jobs: JobPosting[];
  recruiters: RecruiterSummary[];
  messages: ContactMessage[];
}

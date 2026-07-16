import type { JobPosting, Recruiter } from "@/types";
import { seedJobs } from "./jobs";

const jobs: JobPosting[] = [...seedJobs];
const recruiters: Recruiter[] = [
  {
    id: "rec-demo",
    name: "Demo Recruiter",
    email: "recruiter@demo.com",
    company: "Demo Corp",
    createdAt: new Date().toISOString(),
  },
];

const passwords = new Map<string, string>([
  ["recruiter@demo.com", "Demo@1234"],
]);

export const mockStore = {
  jobs: {
    getAll: () => [...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    getByRecruiter: (recruiterId: string) =>
      jobs
        .filter((j) => j.recruiterId === recruiterId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    getById: (id: string) => jobs.find((j) => j.id === id),
    create: (job: JobPosting) => {
      jobs.unshift(job);
      return job;
    },
    delete: (id: string, recruiterId: string) => {
      const idx = jobs.findIndex(
        (j) => j.id === id && j.recruiterId === recruiterId
      );
      if (idx === -1) return false;
      jobs.splice(idx, 1);
      return true;
    },
  },
  recruiters: {
    findByEmail: (email: string) => recruiters.find((r) => r.email === email),
    create: (recruiter: Recruiter, password: string) => {
      recruiters.push(recruiter);
      passwords.set(recruiter.email, password);
      return recruiter;
    },
    verifyPassword: (email: string, password: string) =>
      passwords.get(email) === password,
    updatePassword: (email: string, password: string) => {
      if (!passwords.has(email)) return false;
      passwords.set(email, password);
      return true;
    },
  },
  resetTokens: new Map<string, { email: string; expires: number }>(),
};

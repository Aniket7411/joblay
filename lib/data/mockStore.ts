import { randomBytes, scryptSync } from "node:crypto";
import type { ContactMessage, JobPosting, Recruiter } from "@/types";
import { seedJobs } from "./jobs";

/**
 * In-memory fallback used only when Supabase is not configured (local dev).
 * Data resets whenever the server restarts.
 */

function demoHash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

interface MockRecruiter extends Recruiter {
  passwordHash: string;
  resetTokenHash?: string;
  resetTokenExpires?: number;
}

declare global {
  var joblayMockStore:
    | {
        jobs: JobPosting[];
        recruiters: MockRecruiter[];
        messages: ContactMessage[];
      }
    | undefined;
}

// Survive dev hot-reloads.
const store = (global.joblayMockStore ??= {
  jobs: [...seedJobs],
  recruiters: [
    {
      id: "rec-demo",
      name: "Demo Recruiter",
      email: "recruiter@demo.com",
      company: "Demo Corp",
      role: "recruiter",
      status: "active",
      createdAt: new Date().toISOString(),
      passwordHash: demoHash("Demo@1234"),
    },
    {
      id: "rec-admin",
      name: "Demo Admin",
      email: "admin@demo.com",
      company: "Joblay",
      role: "admin",
      status: "active",
      createdAt: new Date().toISOString(),
      passwordHash: demoHash("Demo@1234"),
    },
  ],
  messages: [],
});

export const mockStore = store;

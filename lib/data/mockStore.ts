import { randomBytes, scryptSync } from "node:crypto";
import type { JobPosting, Recruiter } from "@/types";
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
    | { jobs: JobPosting[]; recruiters: MockRecruiter[] }
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
      createdAt: new Date().toISOString(),
      passwordHash: demoHash("Demo@1234"),
    },
  ],
});

export const mockStore = store;

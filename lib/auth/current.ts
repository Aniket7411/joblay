import { getSessionRecruiterId } from "@/lib/auth/session";
import { findRecruiterById, publicRecruiter } from "@/lib/repository";
import type { Recruiter } from "@/types";

/**
 * The signed-in recruiter (verified against the database), or null.
 * Suspended accounts are treated as signed out.
 */
export async function getCurrentRecruiter(): Promise<Recruiter | null> {
  const id = await getSessionRecruiterId();
  if (!id) return null;
  const recruiter = await findRecruiterById(id);
  if (!recruiter || recruiter.status === "suspended") return null;
  return publicRecruiter(recruiter);
}

/** The signed-in recruiter if they are an admin, otherwise null. */
export async function getCurrentAdmin(): Promise<Recruiter | null> {
  const recruiter = await getCurrentRecruiter();
  return recruiter?.role === "admin" ? recruiter : null;
}

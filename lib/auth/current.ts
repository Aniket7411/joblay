import { getSessionRecruiterId } from "@/lib/auth/session";
import { findRecruiterById, publicRecruiter } from "@/lib/repository";
import type { Recruiter } from "@/types";

/** The signed-in recruiter (verified against the database), or null. */
export async function getCurrentRecruiter(): Promise<Recruiter | null> {
  const id = await getSessionRecruiterId();
  if (!id) return null;
  const recruiter = await findRecruiterById(id);
  return recruiter ? publicRecruiter(recruiter) : null;
}

import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { incrementJobStat } from "@/lib/repository";

const bodySchema = z.object({ kind: z.enum(["view", "contact"]) });

/**
 * Counts a job page view or a contact tap (the browser sends each at most
 * once per job per session). Always answers quickly; counting is best effort.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request body", 400);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return fail("Invalid kind", 400);
  await incrementJobStat((await params).id, parsed.data.kind);
  return ok("Counted");
}

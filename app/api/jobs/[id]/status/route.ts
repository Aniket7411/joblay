import { z } from "zod";
import { fail, ok, serverError, validationFailed } from "@/lib/api";
import { getCurrentRecruiter } from "@/lib/auth/current";
import { notifyJobChanged } from "@/lib/indexing";
import { setJobStatus } from "@/lib/repository";

const bodySchema = z.object({ action: z.enum(["close", "reopen", "renew"]) });

/** Close, reopen or renew (extend 30 days) a job. Owners or admins. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentRecruiter();
    if (!user) return fail("Please sign in", 401);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return validationFailed(parsed.error);

    const { id } = await params;
    const job = await setJobStatus(id, parsed.data.action, user.role === "admin" ? null : user.id);
    if (!job) return fail("Job not found", 404);
    // Closed pages stay up (200) without job data, so this is an update too.
    notifyJobChanged(job.id);

    const messages = { close: "Job closed", reopen: "Job reopened", renew: "Job renewed for 30 days" };
    return ok(messages[parsed.data.action], job);
  } catch (err) {
    return serverError(err, "jobs:status");
  }
}

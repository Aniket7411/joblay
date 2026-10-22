import { z } from "zod";
import { fail, ok, serverError, validationFailed } from "@/lib/api";
import { AiUnavailableError, isAiEnabled, MAX_JD_CHARS, parseJobDescription } from "@/lib/ai/parseJd";
import { getCurrentRecruiter } from "@/lib/auth/current";
import { getTaxonomy } from "@/lib/taxonomy";

const bodySchema = z.object({
  text: z.string().trim().min(80, "Paste the full job description (at least a few lines)").max(MAX_JD_CHARS, "That's too long — paste just the job description"),
});

// Best-effort per-instance limit to protect the free quota: 15 per recruiter per hour.
const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 15;
const usage = new Map<string, number[]>();

export async function POST(request: Request) {
  try {
    const recruiter = await getCurrentRecruiter();
    if (!recruiter) return fail("Please sign in", 401);
    if (!isAiEnabled()) return fail("AI auto-fill is not enabled", 503);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return validationFailed(parsed.error);

    const now = Date.now();
    const recent = (usage.get(recruiter.id) ?? []).filter((t) => now - t < WINDOW_MS);
    if (recent.length >= LIMIT) return fail("You've used AI auto-fill a lot this hour. Please try again later.", 429);
    usage.set(recruiter.id, [...recent, now]);

    const fields = await parseJobDescription(parsed.data.text, await getTaxonomy());
    return ok("Form filled from your job description", fields);
  } catch (err) {
    if (err instanceof AiUnavailableError) return fail(err.message, 503);
    return serverError(err, "ai/parse-jd");
  }
}

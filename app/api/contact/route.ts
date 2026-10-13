import { fail, ok, serverError, validationFailed } from "@/lib/api";
import { sendContactEmail } from "@/lib/mail";
import { contactSchema, contactTopics } from "@/lib/validations";

// Best-effort per-instance throttle: 5 messages per IP per 10 minutes.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  try {
    const parsed = contactSchema.safeParse(await request.json());
    if (!parsed.success) return validationFailed(parsed.error);
    const data = parsed.data;

    // Honeypot filled in: pretend success so bots don't retry.
    if (data.website) return ok("Message sent");

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      "unknown";
    if (rateLimited(ip)) {
      return fail("Too many messages. Please try again later.", 429);
    }

    const topicLabel =
      contactTopics.find((t) => t.value === data.topic)?.label ?? "Message";

    await sendContactEmail({
      name: data.name,
      email: data.email,
      topicLabel,
      message: data.message,
    });

    return ok("Message sent");
  } catch (err) {
    return serverError(err, "contact:POST");
  }
}

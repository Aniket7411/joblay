import { fail, ok, serverError, validationFailed } from "@/lib/api";
import { isMailConfigured, sendContactEmail } from "@/lib/mail";
import { createContactMessage } from "@/lib/repository";
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

    const message = {
      name: data.name,
      email: data.email.trim().toLowerCase(),
      topic: data.topic,
      message: data.message,
    };

    // Save for the admin panel, and email the inbox. Succeed if either works.
    const [saved, emailed] = await Promise.allSettled([
      createContactMessage(message),
      isMailConfigured()
        ? sendContactEmail({ ...message, topicLabel })
        : Promise.reject(new Error("SMTP not configured")),
    ]);
    if (saved.status === "rejected") console.error("[contact] save failed", saved.reason);
    if (emailed.status === "rejected" && isMailConfigured()) {
      console.error("[contact] email failed", emailed.reason);
    }
    if (saved.status === "rejected" && emailed.status === "rejected") {
      return fail("Couldn't send your message. Please try again later.", 503);
    }

    return ok("Message sent");
  } catch (err) {
    return serverError(err, "contact:POST");
  }
}

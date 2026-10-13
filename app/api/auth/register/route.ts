import { fail, ok, serverError, validationFailed } from "@/lib/api";
import { TURNSTILE_FAILED, verifyTurnstile } from "@/lib/turnstile";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { sendWelcomeEmail } from "@/lib/mail";
import {
  createRecruiter,
  findRecruiterByEmail,
  isDuplicateError,
  publicRecruiter,
} from "@/lib/repository";
import { registerSchema } from "@/lib/validations";
import { isValid as isPermanentEmail } from "mailchecker";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!(await verifyTurnstile(body?.turnstileToken, request))) {
      return fail(TURNSTILE_FAILED, 400);
    }
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return validationFailed(parsed.error);

    const { name, email, company, password } = parsed.data;

    // Throwaway inboxes are a common sign of scam recruiter accounts.
    if (!isPermanentEmail(email)) {
      return fail("Please use a permanent work or personal email address", 400);
    }

    if (await findRecruiterByEmail(email)) {
      return fail("Email already registered", 409);
    }

    let recruiter;
    try {
      recruiter = await createRecruiter({
        name: name.trim(),
        email,
        company: company?.trim() || undefined,
        passwordHash: await hashPassword(password),
      });
    } catch (err) {
      // Duplicate key from a concurrent registration.
      if (isDuplicateError(err)) {
        return fail("Email already registered", 409);
      }
      throw err;
    }

    await setSessionCookie(recruiter.id);

    // Don't block or fail signup on email delivery.
    sendWelcomeEmail(recruiter.email, recruiter.name).catch((err) =>
      console.error("[auth/register] welcome email failed", err)
    );

    return ok("Account created successfully", publicRecruiter(recruiter));
  } catch (err) {
    return serverError(err, "auth/register");
  }
}

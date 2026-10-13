import { fail, ok, serverError, validationFailed } from "@/lib/api";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { sendWelcomeEmail } from "@/lib/mail";
import {
  createRecruiter,
  findRecruiterByEmail,
  publicRecruiter,
} from "@/lib/repository";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) return validationFailed(parsed.error);

    const { name, email, company, password } = parsed.data;

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
      if ((err as { code?: number }).code === 11000) {
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

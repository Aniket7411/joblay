import { fail, ok, serverError, validationFailed } from "@/lib/api";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { findRecruiterByEmail, publicRecruiter, recordLogin } from "@/lib/repository";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) return validationFailed(parsed.error);

    const recruiter = await findRecruiterByEmail(parsed.data.email);
    if (
      !recruiter ||
      !(await verifyPassword(parsed.data.password, recruiter.passwordHash))
    ) {
      return fail("Invalid email or password", 401);
    }

    if (recruiter.status === "suspended") {
      return fail("This account has been suspended. Please contact support.", 403);
    }

    await setSessionCookie(recruiter.id);
    await recordLogin(recruiter.id);
    return ok("Signed in successfully", publicRecruiter(recruiter));
  } catch (err) {
    return serverError(err, "auth/login");
  }
}

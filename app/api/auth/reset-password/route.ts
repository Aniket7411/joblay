import { fail, ok, serverError, validationFailed } from "@/lib/api";
import { hashPassword } from "@/lib/auth/password";
import { resetPasswordWithToken } from "@/lib/repository";
import { resetPasswordSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const parsed = resetPasswordSchema.safeParse(await request.json());
    if (!parsed.success) return validationFailed(parsed.error);

    const updated = await resetPasswordWithToken(
      parsed.data.token,
      await hashPassword(parsed.data.password)
    );
    if (!updated) return fail("Invalid or expired reset link", 400);

    return ok("Password reset successfully. You can now sign in.");
  } catch (err) {
    return serverError(err, "auth/reset-password");
  }
}

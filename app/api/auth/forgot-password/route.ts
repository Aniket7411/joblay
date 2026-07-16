import { NextResponse } from "next/server";
import { mockStore } from "@/lib/data/mockStore";
import { sendPasswordResetEmail } from "@/lib/mail";
import { forgotPasswordSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const recruiter = mockStore.recruiters.findByEmail(parsed.data.email);
    if (recruiter) {
      const token = crypto.randomUUID();
      mockStore.resetTokens.set(token, {
        email: parsed.data.email,
        expires: Date.now() + 3600_000,
      });

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const resetLink = `${baseUrl}/reset-password?token=${token}`;
      await sendPasswordResetEmail(parsed.data.email, resetLink);
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists, a reset link has been sent.",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 }
    );
  }
}

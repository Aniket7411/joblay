import { NextResponse } from "next/server";
import { mockStore } from "@/lib/data/mockStore";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

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
    if (
      !recruiter ||
      !mockStore.recruiters.verifyPassword(parsed.data.email, parsed.data.password)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Signed in successfully",
      data: {
        id: recruiter.id,
        name: recruiter.name,
        email: recruiter.email,
        company: recruiter.company,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 }
    );
  }
}

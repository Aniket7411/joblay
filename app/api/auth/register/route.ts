import { NextResponse } from "next/server";
import { mockStore } from "@/lib/data/mockStore";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

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

    const existing = mockStore.recruiters.findByEmail(parsed.data.email);
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 409 }
      );
    }

    const recruiter = mockStore.recruiters.create(
      {
        id: `rec-${crypto.randomUUID().slice(0, 8)}`,
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company || undefined,
        createdAt: new Date().toISOString(),
      },
      parsed.data.password
    );

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
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

import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { DatabaseUnavailableError } from "@/lib/repository";

export function ok<T>(message: string, data?: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, message, data }, init);
}

export function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export function validationFailed(error: ZodError) {
  return NextResponse.json(
    {
      success: false,
      message: "Validation failed",
      errors: error.flatten().fieldErrors,
    },
    { status: 400 }
  );
}

/** Maps unexpected errors to a JSON response and logs them. */
export function serverError(err: unknown, context: string) {
  if (err instanceof SyntaxError) return fail("Invalid request body", 400);
  if (err instanceof DatabaseUnavailableError) {
    console.error(`[${context}]`, err.message);
    return fail("Service temporarily unavailable", 503);
  }
  console.error(`[${context}]`, err);
  return fail("Something went wrong. Please try again.", 500);
}

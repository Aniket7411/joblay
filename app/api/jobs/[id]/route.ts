import { NextResponse } from "next/server";
import { mockStore } from "@/lib/data/mockStore";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const recruiterId = body.recruiterId as string;

    if (!recruiterId) {
      return NextResponse.json(
        { success: false, message: "Recruiter ID required" },
        { status: 401 }
      );
    }

    const deleted = mockStore.jobs.delete(id, recruiterId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Job deleted",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request" },
      { status: 400 }
    );
  }
}

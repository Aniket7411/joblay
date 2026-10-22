import { ok, serverError } from "@/lib/api";
import { getLiveJobsByIds } from "@/lib/repository";

/** The still-live jobs among a visitor's saved ids: GET /api/jobs/saved?ids=a,b */
export async function GET(request: Request) {
  try {
    const ids = (new URL(request.url).searchParams.get("ids") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 100);
    return ok("OK", await getLiveJobsByIds(ids));
  } catch (err) {
    return serverError(err, "jobs/saved:GET");
  }
}

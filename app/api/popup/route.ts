import { ok } from "@/lib/api";
import { getBulkHiringPopup } from "@/lib/bulkHiring";

/** Public: the bulk hiring popup, or { enabled: false } while it's off. */
export async function GET() {
  const popup = await getBulkHiringPopup();
  return ok("OK", popup.enabled ? popup : { enabled: false }, {
    headers: { "Cache-Control": "no-store" },
  });
}

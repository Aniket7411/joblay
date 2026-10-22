import { z } from "zod";
import { getSetting, setSetting } from "@/lib/repository";
import type { BulkHiringPopup } from "@/types";

/**
 * The "bulk hiring" popup: an enquiry form for employers hiring many people,
 * shown to visitors only while an admin has it switched on (Admin → Popup).
 * Enquiries arrive in Admin → Messages under "Bulk hiring enquiry".
 */
const KEY = "bulk_hiring_popup";

export const defaultBulkHiringPopup: BulkHiringPopup = {
  enabled: false,
  title: "Hiring in bulk?",
  message: "Need 10, 50 or 500+ people? Tell us your requirement and our team will call you back within a day.",
  delaySeconds: 8,
};

export const bulkHiringPopupSchema = z.object({
  enabled: z.boolean(),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(80),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(300),
  delaySeconds: z.number().int().min(0).max(120),
});

/** Current settings; defaults (switched off) if never saved or unreadable. */
export async function getBulkHiringPopup(): Promise<BulkHiringPopup> {
  try {
    const saved = await getSetting<Partial<BulkHiringPopup>>(KEY);
    return { ...defaultBulkHiringPopup, ...saved };
  } catch (err) {
    console.error("[bulkHiring] using defaults:", err instanceof Error ? err.message : err);
    return defaultBulkHiringPopup;
  }
}

export async function saveBulkHiringPopup(
  input: z.infer<typeof bulkHiringPopupSchema>
): Promise<BulkHiringPopup> {
  const value: BulkHiringPopup = { ...input, updatedAt: new Date().toISOString() };
  await setSetting(KEY, value);
  return value;
}

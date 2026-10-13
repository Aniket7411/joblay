// "max" metadata validates real number patterns ("min" only checks length).
// Server-only, so its size doesn't reach the browser.
import { parsePhoneNumberFromString } from "libphonenumber-js/max";

/**
 * Validates a phone number (Indian by default, any country with a +code) and
 * returns it in E.164 form (+919876543210), or null if it isn't a real number.
 * E.164 keeps tel: and wa.me links working.
 */
export function normalizePhone(input: string): string | null {
  const parsed = parsePhoneNumberFromString(input.trim(), "IN");
  return parsed?.isValid() ? parsed.number : null;
}

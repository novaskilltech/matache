import {
  parsePhoneNumberFromString,
  isSupportedCountry,
  type CountryCode,
} from "libphonenumber-js";
import type { Client } from "./models";
export function phoneCountry(input: string): CountryCode {
  return isSupportedCountry(input) ? input : "FR";
}
export function normalizePhone(
  raw: string | null,
  country: CountryCode = "FR",
): string | null {
  if (!raw?.trim()) return null;
  const value = raw.trim().replace(/^00/, "+");
  const parsed = parsePhoneNumberFromString(value, country);
  return parsed?.isValid() ? parsed.number : null;
}
export function matchClient(
  clients: Client[],
  rawPhone: string | null,
  name: string | null,
  country: CountryCode = "FR",
) {
  const phone = normalizePhone(rawPhone, country);
  const exact = phone
    ? clients.find((c) => c.phone_normalized === phone)
    : undefined;
  const candidates = name
    ? clients.filter(
        (c) =>
          c.name?.trim().toLocaleLowerCase() ===
          name.trim().toLocaleLowerCase(),
      )
    : [];
  return { exact, candidates, phone };
}

import type { Currency } from "@/config/pricing";

// Pricing region (spec section 11): Cloudflare's CF-IPCountry header decides; IN pays in rupees, everyone else in
// dollars. Without the header (local development and the local Workers preview) DEV_REGION decides, default IN.
// In development only, the footer's region switcher can override both through a cookie.

export const DEV_REGION_COOKIE = "iloveui.region";

export function currencyForCountry(country: string | null | undefined): Currency {
  return country?.trim().toUpperCase() === "IN" ? "INR" : "USD";
}

export function resolveCurrency({
  countryHeader,
  devCookie,
  devRegion = process.env.DEV_REGION,
  development = process.env.NODE_ENV === "development",
}: {
  countryHeader: string | null;
  devCookie?: string | null;
  devRegion?: string;
  development?: boolean;
}): Currency {
  if (development && devCookie) return currencyForCountry(devCookie);
  if (countryHeader) return currencyForCountry(countryHeader);
  return currencyForCountry(devRegion || "IN");
}

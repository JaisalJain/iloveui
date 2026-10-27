import { describe, expect, it } from "vitest";
import { FREE_PLAN, PAID_PLANS, formatPrice } from "@/config/pricing";
import { currencyForCountry, resolveCurrency } from "@/lib/region";

describe("plans (spec section 11)", () => {
  it("has the owner's prices", () => {
    expect(FREE_PLAN.designs).toBe(24);
    expect(PAID_PLANS.pro.prices.USD).toEqual({ amountMinor: 9_900, regularMinor: 14_900 });
    expect(PAID_PLANS.pro.prices.INR.amountMinor).toBe(499_900);
    expect(PAID_PLANS.team.prices.USD.amountMinor).toBe(29_900);
    expect(PAID_PLANS.team.prices.INR.amountMinor).toBe(1_499_900);
    expect(PAID_PLANS.team.seats).toBe(10);
  });

  it("formats whole prices the way each currency reads them", () => {
    expect(formatPrice(9_900, "USD")).toBe("$99");
    expect(formatPrice(499_900, "INR")).toBe("₹4,999");
    expect(formatPrice(1_499_900, "INR")).toBe("₹14,999");
  });
});

describe("pricing region", () => {
  it("charges rupees in India and dollars everywhere else", () => {
    expect(currencyForCountry("IN")).toBe("INR");
    expect(currencyForCountry("in")).toBe("INR");
    expect(currencyForCountry("US")).toBe("USD");
    expect(currencyForCountry("XX")).toBe("USD");
  });

  it("prefers the CF-IPCountry header, then DEV_REGION, defaulting to India", () => {
    expect(resolveCurrency({ countryHeader: "DE", devRegion: "IN", development: false })).toBe("USD");
    expect(resolveCurrency({ countryHeader: null, devRegion: "US", development: false })).toBe("USD");
    expect(resolveCurrency({ countryHeader: null, devRegion: "", development: false })).toBe("INR");
  });

  it("lets the switcher cookie override the region only in development", () => {
    expect(resolveCurrency({ countryHeader: "IN", devCookie: "US", development: true })).toBe("USD");
    expect(resolveCurrency({ countryHeader: "IN", devCookie: "US", development: false })).toBe("INR");
  });
});

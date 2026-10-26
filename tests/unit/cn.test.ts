import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("keeps custom font sizes next to text colors", () => {
    expect(cn("text-28 text-muted", "text-fg")).toBe("text-28 text-fg");
  });

  it("lets later custom sizes and colors win", () => {
    expect(cn("bg-surface text-14", "bg-raised text-20")).toBe("bg-raised text-20");
  });

  it("merges custom radius and shadow tokens", () => {
    expect(cn("rounded-control shadow-sm", "rounded-card shadow-lg")).toBe("rounded-card shadow-lg");
  });

  it("drops falsy values", () => {
    expect(cn("p-4", false, undefined, null, "text-fg")).toBe("p-4 text-fg");
  });
});

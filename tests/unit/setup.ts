import { afterEach, expect, vi } from "vitest";

// "Zero warnings": any console warning or error during a test fails it.
const warn = vi.spyOn(console, "warn");
const error = vi.spyOn(console, "error");

afterEach(() => {
  expect(warn).not.toHaveBeenCalled();
  expect(error).not.toHaveBeenCalled();
});

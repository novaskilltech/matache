import { describe, it, expect } from "vitest";
import { publicConfig } from "@/lib/config";
describe("configuration", () => {
  it("fails closed without credentials", () => {
    expect(() => publicConfig()).toThrow("Supabase non configuré");
  });
});

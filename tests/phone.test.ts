import { it, expect } from "vitest";
import { normalizePhone, matchClient } from "@/lib/domain/phone";
import { demoClients } from "@/lib/demo";
it("normalizes local, international and 00 formats into one E.164", () => {
  expect(normalizePhone("06 12 34 56 78")).toBe("+33612345678");
  expect(normalizePhone("+33 6 12 34 56 78")).toBe("+33612345678");
  expect(normalizePhone("0033612345678")).toBe("+33612345678");
  expect(normalizePhone("0716014148", "MA")).toBe("+212716014148");
});
it("does not invent invalid/missing numbers", () => {
  expect(normalizePhone(null)).toBeNull();
  expect(normalizePhone("12")).toBeNull();
});
it("matches phones, but never merges automatically on name", () => {
  const clients = [{ ...demoClients[0], phone_normalized: "+33612345678" }];
  expect(matchClient(clients, "0612345678", null).exact?.id).toBe(
    clients[0].id,
  );
  const match = matchClient(clients, null, "Mme Benali");
  expect(match.exact).toBeUndefined();
  expect(match.candidates).toHaveLength(1);
});

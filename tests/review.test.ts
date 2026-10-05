import { it, expect } from "vitest";
import { manualResult } from "@/lib/ai/schema";
import { correctedField, lowConfidenceGroups } from "@/lib/domain/review";
it("manual correction retains nulls and removes obsolete evidence", () => {
  const r = manualResult();
  r.evidence = [
    {
      field_path: "client.name",
      attachment_ids: ["30000000-0000-4000-8000-000000000001"],
    },
  ];
  const updated = correctedField(r, "client", "name", "Mme Benali");
  expect(updated.client.name).toBe("Mme Benali");
  expect(updated.evidence).toHaveLength(0);
  expect(updated.confidence.client).toBe(0);
  expect(updated.financial.total_amount).toBeNull();
});
it("flags useful low-confidence data", () => {
  expect(lowConfidenceGroups(manualResult("INVOICE"))).toContain("action");
});

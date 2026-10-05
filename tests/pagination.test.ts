import { it, expect } from "vitest";
import { readAllRows } from "@/lib/repositories/pagination";
it("does not silently omit old actions beyond one database response", async () => {
  const records = Array.from({ length: 1001 }, (_, id) => ({ id }));
  const all = await readAllRows(async (from, to) => ({
    data: records.slice(from, to + 1),
    error: null,
  }));
  expect(all).toHaveLength(1001);
  expect(all[1000]).toEqual({ id: 1000 });
});

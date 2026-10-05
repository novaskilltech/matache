import { it, expect } from "vitest";
import { snoozeAt, localDateTimeToUtc } from "@/lib/domain/reminders";
it("supports all preset offsets", () => {
  const now = new Date("2026-10-05T10:00:00Z");
  expect(snoozeAt("hour", now)).toBe("2026-10-05T11:00:00.000Z");
  expect(snoozeAt("tonight", now)).toBe("2026-10-05T18:00:00.000Z");
  expect(snoozeAt("tomorrow", now)).toBe("2026-10-06T07:00:00.000Z");
  expect(snoozeAt("2days", now)).toBe("2026-10-07T07:00:00.000Z");
  expect(snoozeAt("3days", now)).toBe("2026-10-08T07:00:00.000Z");
  expect(snoozeAt("week", now)).toBe("2026-10-12T07:00:00.000Z");
});
it("preserves wall clock across DST and rejects past custom dates", () => {
  expect(snoozeAt("tomorrow", new Date("2026-10-24T10:00:00Z"))).toBe(
    "2026-10-25T08:00:00.000Z",
  );
  expect(localDateTimeToUtc("2026-12-01T09:00")).toBe(
    "2026-12-01T08:00:00.000Z",
  );
  expect(() =>
    snoozeAt("custom", new Date("2026-10-05"), "2026-01-01T09:00"),
  ).toThrow();
});
it("rejects nonexistent DST times", () => {
  expect(() => localDateTimeToUtc("2026-03-29T02:30")).toThrow();
});

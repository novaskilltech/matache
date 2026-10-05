import { it, expect } from "vitest";
import {
  activeActions,
  isOverdue,
  priorityRank,
  isToday,
  matchesSearch,
} from "@/lib/domain/queue";
import { demoActions, demoClients } from "@/lib/demo";
it("past-due TODO is overdue, DONE is excluded", () => {
  const past = "2026-01-01T00:00:00Z";
  expect(isOverdue({ status: "TODO", due_at: past })).toBe(true);
  expect(isOverdue({ status: "DONE", due_at: past })).toBe(false);
  expect(activeActions([{ ...demoActions[0], status: "DONE" }])).toHaveLength(
    0,
  );
});
it("maps priority without changing status", () => {
  expect(priorityRank("URGENT")).toBeLessThan(priorityRank("TODAY"));
  expect(priorityRank("TODAY")).toBeLessThan(priorityRank("NORMAL"));
});
it("uses Paris calendar day", () => {
  expect(
    isToday("2026-10-05T23:30:00Z", new Date("2026-10-06T10:00:00Z")),
  ).toBe(true);
});
it("searches clients, cities, dates and action text", () => {
  expect(matchesSearch(demoActions[0], demoClients[0], "Bruxelles")).toBe(true);
  expect(matchesSearch(demoActions[0], demoClients[0], "Benali")).toBe(true);
  expect(matchesSearch(demoActions[0], demoClients[0], "facture")).toBe(true);
});

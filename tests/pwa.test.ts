import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import manifest from "@/app/manifest";
it("provides Android share target with gallery fallback", () => {
  expect(manifest().display).toBe("standalone");
  expect(JSON.stringify(manifest())).toContain("share-target");
  expect(manifest().icons?.length).toBe(3);
});
it("service worker never caches private requests or push payloads", () => {
  const sw = readFileSync("public/sw.js", "utf8");
  expect(sw).not.toContain("cache.put");
  expect(sw).not.toContain("event.data");
  expect(sw).toContain("10*60*1000");
  expect(sw).toContain("PUBLIC.includes(u.pathname)");
});

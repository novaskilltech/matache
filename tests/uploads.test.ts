import { it, expect } from "vitest";
import { uploadBatchSchema, isImageSignature } from "@/lib/domain/uploads";
it("rejects invalid types, oversized files and batches", () => {
  expect(
    uploadBatchSchema.safeParse({
      files: [{ type: "image/svg+xml", size: 100 }],
    }).success,
  ).toBe(false);
  expect(
    uploadBatchSchema.safeParse({
      files: [{ type: "image/png", size: 11 * 1024 * 1024 }],
    }).success,
  ).toBe(false);
  expect(
    uploadBatchSchema.safeParse({
      files: Array.from({ length: 3 }, () => ({
        type: "image/png",
        size: 8 * 1024 * 1024,
      })),
    }).success,
  ).toBe(false);
});
it("checks magic bytes rather than trusting extensions", () => {
  expect(
    isImageSignature(
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      "image/png",
    ),
  ).toBe(true);
  expect(
    isImageSignature(new TextEncoder().encode("<script>"), "image/png"),
  ).toBe(false);
});

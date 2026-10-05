import { z } from "zod";
export const MAX_FILE = 10 * 1024 * 1024,
  MAX_BATCH = 20 * 1024 * 1024;
export const mimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export const uploadBatchSchema = z
  .object({
    files: z
      .array(
        z.object({
          type: z.enum(mimeTypes),
          size: z.number().int().positive().max(MAX_FILE),
        }),
      )
      .min(1)
      .max(8),
  })
  .refine(
    (b) => b.files.reduce((n, f) => n + f.size, 0) <= MAX_BATCH,
    "Maximum 20 Mo par dossier",
  );
export const attachmentSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  client_id: z.string().uuid().nullable(),
  analysis_id: z.string().uuid(),
  storage_path: z.string(),
  mime_type: z.enum(mimeTypes),
  size_bytes: z.number(),
  created_at: z.string(),
});
export function isImageSignature(bytes: Uint8Array, mime: string) {
  if (mime === "image/jpeg")
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (mime === "image/png")
    return [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n);
  return (
    mime === "image/webp" &&
    new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
  );
}
export function extension(mime: string) {
  return mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
}

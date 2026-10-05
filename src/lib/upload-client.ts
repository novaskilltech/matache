import { z } from "zod";
import { browserDb } from "@/lib/supabase/browser";
import { uploadBatchSchema } from "@/lib/domain/uploads";
const preparedSchema = z.object({
  analysisId: z.string().uuid(),
  files: z.array(
    z.object({ id: z.string().uuid(), path: z.string(), token: z.string() }),
  ),
});
export async function uploadScreenshots(files: File[]) {
  const body = uploadBatchSchema.parse({
    files: files.map((f) => ({ type: f.type, size: f.size })),
  });
  const res = await fetch("/api/uploads/prepare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Impossible de préparer l’import.");
  const prepared = preparedSchema.parse(await res.json());
  const db = browserDb();
  for (let i = 0; i < files.length; i++) {
    const f = prepared.files[i];
    const { error } = await db.storage
      .from("matache-private")
      .uploadToSignedUrl(f.path, f.token, files[i], {
        contentType: files[i].type,
        cacheControl: "0",
      });
    if (error) throw new Error("Envoi interrompu. Vérifiez votre connexion.");
  }
  const final = await fetch("/api/uploads/finalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analysisId: prepared.analysisId }),
  });
  if (!final.ok) throw new Error("Certaines images ne sont pas valides.");
  return prepared.analysisId;
}

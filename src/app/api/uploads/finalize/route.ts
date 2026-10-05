import { NextResponse } from "next/server";
import { uuid } from "@/lib/domain/models";
import { listAttachments } from "@/lib/repositories/attachments";
import { workspaceContext } from "@/lib/repositories/workspace";
import { isImageSignature } from "@/lib/domain/uploads";
import { apiError, requireSameOrigin, HttpError } from "@/lib/http";
export async function POST(req: Request) {
  try {
    requireSameOrigin(req);
    const { analysisId } = (await req.json()) as { analysisId: unknown };
    const id = uuid.parse(analysisId);
    const { db, workspaceId } = await workspaceContext();
    const attachments = await listAttachments({ analysisId: id });
    if (!attachments.length) throw new HttpError(400, "Images manquantes");
    for (const a of attachments) {
      const { data, error } = await db.storage
        .from("matache-private")
        .download(a.storage_path);
      if (error || !data) throw new HttpError(400, "Upload incomplet");
      const bytes = new Uint8Array(await data.arrayBuffer());
      if (data.size !== a.size_bytes || !isImageSignature(bytes, a.mime_type)) {
        await db.storage.from("matache-private").remove([a.storage_path]);
        throw new HttpError(400, "Image invalide");
      }
    }
    const { error } = await db
      .from("analyses")
      .update({ status: "UPLOADED", error_code: null })
      .eq("workspace_id", workspaceId)
      .eq("id", id)
      .eq("status", "UPLOADED");
    if (error) throw error;
    return NextResponse.json(
      { analysisId: id },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}

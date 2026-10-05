import { checkBudget } from "@/lib/services/budget";
import { NextResponse } from "next/server";
import { workspaceContext } from "@/lib/repositories/workspace";
import { uploadBatchSchema, extension } from "@/lib/domain/uploads";
import { requireSameOrigin, apiError } from "@/lib/http";
export async function POST(req: Request) {
  try {
    requireSameOrigin(req);
    const { db, workspaceId } = await workspaceContext();
    const batch = uploadBatchSchema.parse(await req.json());
    await checkBudget(db, workspaceId, "upload");
    const analysisId = crypto.randomUUID();
    const { error } = await db
      .from("analyses")
      .insert({ id: analysisId, workspace_id: workspaceId });
    if (error) throw error;
    const files = [];
    for (const f of batch.files) {
      const id = crypto.randomUUID();
      const path = `${workspaceId}/clients/${analysisId}/attachments/${id}.${extension(f.type)}`;
      const row = await db.from("attachments").insert({
        id,
        workspace_id: workspaceId,
        analysis_id: analysisId,
        storage_path: path,
        mime_type: f.type,
        size_bytes: f.size,
      });
      if (row.error) throw row.error;
      const signed = await db.storage
        .from("matache-private")
        .createSignedUploadUrl(path);
      if (signed.error) throw signed.error;
      files.push({ id, path, token: signed.data.token });
    }
    return NextResponse.json(
      { analysisId, files },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}

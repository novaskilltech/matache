import { checkBudget } from "@/lib/services/budget";
import { NextResponse } from "next/server";
import { workspaceContext } from "@/lib/repositories/workspace";
import { listAttachments } from "@/lib/repositories/attachments";
import { getAnalysis } from "@/lib/repositories/analysis";
import { uuid } from "@/lib/domain/models";
import { isImageSignature } from "@/lib/domain/uploads";
import { configuredProvider } from "@/lib/ai/provider";
import { apiError, requireSameOrigin, HttpError } from "@/lib/http";
export const maxDuration = 120;
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let analysisId: string | undefined;
  try {
    requireSameOrigin(req);
    analysisId = uuid.parse((await params).id);
    const { db, workspaceId } = await workspaceContext();
    const existing = await getAnalysis(analysisId);
    if (existing.status === "PROCESSING") {
      const stale = await db
        .from("analyses")
        .update({ status: "FAILED" })
        .eq("workspace_id", workspaceId)
        .eq("id", analysisId)
        .lt("processing_at", new Date(Date.now() - 180000).toISOString());
      if (stale.error) throw stale.error;
    }
    if (existing.status === "READY" || existing.status === "VALIDATED")
      return NextResponse.json({ status: existing.status });
    if (existing.status === "IGNORED")
      throw new HttpError(409, "Analysis ignored");
    const claim = await db
      .from("analyses")
      .update({ status: "PROCESSING", processing_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId)
      .eq("id", analysisId)
      .in("status", ["UPLOADED", "FAILED"])
      .select("id")
      .maybeSingle();
    if (claim.error) throw claim.error;
    if (!claim.data)
      return NextResponse.json({ status: "PROCESSING" }, { status: 202 });
    await checkBudget(db, workspaceId, "ai");
    const provider = configuredProvider();
    const attachments = await listAttachments({ analysisId });
    const images = [];
    if (!attachments.length) throw new Error("IMAGES_MISSING");
    for (const a of attachments) {
      const { data, error } = await db.storage
        .from("matache-private")
        .download(a.storage_path);
      if (error || !data) throw new Error("IMAGE_UNAVAILABLE");
      const bytes = new Uint8Array(await data.arrayBuffer());
      if (data.size !== a.size_bytes || !isImageSignature(bytes, a.mime_type))
        throw new Error("INVALID_IMAGE");
      images.push({
        attachmentId: a.id,
        mimeType: a.mime_type,
        base64: Buffer.from(bytes).toString("base64"),
      });
    }
    const result = await provider.analyze(images, new Date().toISOString());
    const { error } = await db
      .from("analyses")
      .update({ status: "READY", result, error_code: null })
      .eq("workspace_id", workspaceId)
      .eq("id", analysisId)
      .eq("status", "PROCESSING");
    if (error) throw error;
    return NextResponse.json(
      { status: "READY" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    if (analysisId) {
      try {
        const { db, workspaceId } = await workspaceContext();
        await db
          .from("analyses")
          .update({ status: "FAILED", error_code: "AI_UNAVAILABLE" })
          .eq("workspace_id", workspaceId)
          .eq("id", analysisId)
          .eq("status", "PROCESSING");
      } catch {
        /* Keep uploads intact even if status write fails. */
      }
    }
    return apiError(e);
  }
}
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return NextResponse.json(await getAnalysis((await params).id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return apiError(e);
  }
}

import { NextResponse } from "next/server";
import { workspaceContext } from "@/lib/repositories/workspace";
import { uuid } from "@/lib/domain/models";
import { apiError, requireSameOrigin } from "@/lib/http";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireSameOrigin(req);
    const { db, workspaceId } = await workspaceContext();
    const { error } = await db
      .from("analyses")
      .update({ status: "IGNORED" })
      .eq("workspace_id", workspaceId)
      .eq("id", uuid.parse((await params).id))
      .in("status", ["UPLOADED", "READY", "FAILED"]);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}

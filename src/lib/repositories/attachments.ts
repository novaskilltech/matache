import "server-only";
import { workspaceContext } from "./workspace";
import { attachmentSchema } from "@/lib/domain/uploads";
import { uuid } from "@/lib/domain/models";
export async function listAttachments(filter: {
  analysisId?: string;
  clientId?: string;
}) {
  const { db, workspaceId } = await workspaceContext();
  let q = db
    .from("attachments")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at");
  if (filter.analysisId) q = q.eq("analysis_id", uuid.parse(filter.analysisId));
  if (filter.clientId) q = q.eq("client_id", uuid.parse(filter.clientId));
  const { data, error } = await q;
  if (error) throw new Error("Attachments unavailable");
  return attachmentSchema.array().parse(data);
}
export async function attachmentUrl(id: string) {
  const { db, workspaceId } = await workspaceContext();
  const { data, error } = await db
    .from("attachments")
    .select("*")
    .eq("id", uuid.parse(id))
    .eq("workspace_id", workspaceId)
    .single();
  if (error) throw new Error("Attachment inaccessible");
  const a = attachmentSchema.parse(data);
  const signed = await db.storage
    .from("matache-private")
    .createSignedUrl(a.storage_path, 60);
  if (signed.error) throw new Error("Source unavailable");
  return signed.data.signedUrl;
}

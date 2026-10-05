import "server-only";
import { isConfigured } from "@/lib/config";
import { workspaceContext } from "./workspace";
import { analysisRowSchema } from "./analysis";
export async function pendingImports(page = 0) {
  if (!isConfigured()) return { items: [], total: 0 };
  const { db, workspaceId } = await workspaceContext();
  const { data, error, count } = await db
    .from("analyses")
    .select("*", { count: "exact" })
    .eq("workspace_id", workspaceId)
    .in("status", ["UPLOADED", "PROCESSING", "READY", "FAILED"])
    .order("created_at", { ascending: true })
    .range(page * 50, page * 50 + 49);
  if (error) throw new Error("Inbox unavailable");
  return { items: analysisRowSchema.array().parse(data), total: count ?? 0 };
}

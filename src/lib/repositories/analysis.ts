import "server-only";
import { z } from "zod";
import { workspaceContext } from "./workspace";
import { uuid } from "@/lib/domain/models";
import { analysisResultSchema } from "@/lib/ai/schema";
export const analysisRowSchema = z.object({
  id: uuid,
  workspace_id: uuid,
  client_id: uuid.nullable(),
  status: z.enum([
    "UPLOADED",
    "PROCESSING",
    "READY",
    "FAILED",
    "VALIDATED",
    "IGNORED",
  ]),
  result: analysisResultSchema.nullable(),
  error_code: z.string().nullable(),
  created_at: z.string(),
});
export async function getAnalysis(id: string) {
  const { db, workspaceId } = await workspaceContext();
  const { data, error } = await db
    .from("analyses")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", uuid.parse(id))
    .single();
  if (error) throw new Error("Analysis inaccessible");
  return analysisRowSchema.parse(data);
}

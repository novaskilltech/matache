import "server-only";
import type { serverDb } from "@/lib/supabase/server";
import { HttpError } from "@/lib/http";
export async function checkBudget(
  db: Awaited<ReturnType<typeof serverDb>>,
  workspaceId: string,
  kind: "upload" | "ai",
) {
  const { data, error } = await db.rpc("consume_budget", {
    p_workspace: workspaceId,
    p_kind: kind,
  });
  if (error) throw new Error("Budget unavailable");
  if (data !== true) throw new HttpError(429, "Limit reached");
}

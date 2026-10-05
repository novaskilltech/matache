import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "@/lib/http";
export async function checkBudget(
  db: SupabaseClient,
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

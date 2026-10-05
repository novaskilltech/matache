import "server-only";
import { serverDb } from "@/lib/supabase/server";
import { uuid } from "@/lib/domain/models";
export async function workspaceContext() {
  const db = await serverDb();
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user) throw new Error("Authentication required");
  const { data, error } = await db.rpc("bootstrap_workspace");
  if (error) throw new Error("Workspace unavailable");
  return { db, workspaceId: uuid.parse(data), userId: auth.user.id };
}

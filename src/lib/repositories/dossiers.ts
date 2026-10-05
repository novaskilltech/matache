import "server-only";
import { readAllRows } from "./pagination";
import { workspaceContext } from "./workspace";
import {
  actionSchema,
  clientSchema,
  eventSchema,
  uuid,
} from "@/lib/domain/models";
export async function listDossiers() {
  const { db, workspaceId } = await workspaceContext();
  const [clients, actions] = await Promise.all([
    readAllRows((from, to) =>
      db
        .from("clients")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .order("id")
        .range(from, to),
    ),
    readAllRows((from, to) =>
      db
        .from("actions")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .order("id")
        .range(from, to),
    ),
  ]);
  return {
    clients: clientSchema.array().parse(clients),
    actions: actionSchema.array().parse(actions),
  };
}
export async function timeline(clientId: string) {
  const { db, workspaceId } = await workspaceContext();
  const { data, error } = await db
    .from("action_events")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("client_id", uuid.parse(clientId))
    .order("created_at", { ascending: false });
  if (error) throw new Error("Timeline unavailable");
  return eventSchema.array().parse(data);
}
export async function transition(
  id: string,
  status: "TODO" | "WAITING" | "DONE",
  due: string | null = null,
  event = "STATUS_CHANGED",
) {
  const { db, workspaceId } = await workspaceContext();
  const { error } = await db.rpc("transition_action", {
    p_workspace: workspaceId,
    p_action: uuid.parse(id),
    p_status: status,
    p_due: due,
    p_event: event,
  });
  if (error) throw new Error("Action update failed");
}

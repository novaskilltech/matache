"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { transition } from "@/lib/repositories/dossiers";
import { workspaceContext } from "@/lib/repositories/workspace";
import { snoozeAt, snoozeOptions } from "@/lib/domain/reminders";
import { categories, priorities, statuses, uuid } from "@/lib/domain/models";
export async function changeStatus(form: FormData) {
  const id = uuid.parse(form.get("id"));
  const status = z.enum(statuses).parse(form.get("status"));
  await transition(id, status);
  revalidatePath("/", "layout");
}
export async function editAction(form: FormData) {
  const id = uuid.parse(form.get("id"));
  const data = z
    .object({
      title: z.string().min(1).max(240),
      description: z.string().max(4000),
      category: z.enum(categories),
      priority: z.enum(priorities),
    })
    .parse(
      Object.fromEntries(
        ["title", "description", "category", "priority"].map((k) => [
          k,
          form.get(k),
        ]),
      ),
    );
  const { db, workspaceId } = await workspaceContext();
  const { error } = await db.rpc("edit_action", {
    p_workspace: workspaceId,
    p_action: id,
    p_patch: data,
  });
  if (error) throw new Error("Update failed");
  revalidatePath("/", "layout");
  redirect("/actions/" + id);
}
export async function editClient(form: FormData) {
  const id = uuid.parse(form.get("id"));
  const name = z.string().max(240).parse(form.get("name"));
  const { db, workspaceId } = await workspaceContext();
  const { error } = await db
    .from("clients")
    .update({ name: name || null })
    .eq("workspace_id", workspaceId)
    .eq("id", id);
  if (error) throw new Error("Update failed");
  revalidatePath("/", "layout");
  redirect("/clients/" + id);
}
export async function signOut() {
  const { db } = await workspaceContext();
  const { data } = await db.auth.getUser();
  if (data.user)
    await db.from("push_subscriptions").delete().eq("user_id", data.user.id);
  await db.auth.signOut();
  redirect("/login");
}

export async function snoozeAction(form: FormData) {
  const id = uuid.parse(form.get("id"));
  const option = z.enum(snoozeOptions).parse(form.get("option"));
  const due = snoozeAt(option, new Date(), String(form.get("custom") || ""));
  const { db, workspaceId } = await workspaceContext();
  const { data, error } = await db
    .from("actions")
    .select("status")
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .single();
  if (error || !data || data.status === "DONE")
    throw new Error("Action inaccessible");
  await transition(id, z.enum(statuses).parse(data.status), due, "SNOOZED");
  revalidatePath("/", "layout");
}
export async function followUp(form: FormData) {
  const id = uuid.parse(form.get("id"));
  const kind = z
    .enum(["FOLLOW_UP", "DOCUMENTS_RECEIVED"])
    .parse(form.get("kind"));
  const { db, workspaceId } = await workspaceContext();
  const { error } = await db.rpc("follow_up", {
    p_workspace: workspaceId,
    p_action: id,
    p_kind: kind,
  });
  if (error) throw new Error("Follow up failed");
  revalidatePath("/", "layout");
}

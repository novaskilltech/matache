import { NextResponse } from "next/server";
import { z } from "zod";
import { subscriptionSchema } from "@/lib/domain/push";
import { workspaceContext } from "@/lib/repositories/workspace";
import { apiError, requireSameOrigin } from "@/lib/http";
export async function POST(req: Request) {
  try {
    requireSameOrigin(req);
    const subscription = subscriptionSchema.parse(await req.json());
    const { db, workspaceId, userId } = await workspaceContext();
    const { error } = await db
      .from("push_subscriptions")
      .upsert(
        { ...subscription, workspace_id: workspaceId, user_id: userId },
        { onConflict: "endpoint" },
      );
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(req: Request) {
  try {
    requireSameOrigin(req);
    const { endpoint } = z
      .object({ endpoint: z.string().url().max(4096) })
      .parse(await req.json());
    const { db, workspaceId, userId } = await workspaceContext();
    const { error } = await db
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}

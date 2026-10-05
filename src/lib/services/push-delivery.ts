import "server-only";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { z } from "zod";
import { subscriptionSchema, safePushPayload } from "@/lib/domain/push";
const reminderSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  action_id: z.string().uuid(),
});
const subscriptionRow = subscriptionSchema.extend({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
});
export async function deliverReminders() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY,
    publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    privateKey = process.env.VAPID_PRIVATE_KEY,
    subject = process.env.VAPID_SUBJECT;
  if (!url || !key || !publicKey || !privateKey || !subject)
    throw new Error("PUSH_NOT_CONFIGURED");
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  webpush.setVapidDetails(subject, publicKey, privateKey);
  const claim = await db.rpc("claim_reminders", { p_limit: 100 });
  if (claim.error) throw new Error("REMINDER_CLAIM_FAILED");
  const reminders = reminderSchema.array().parse(claim.data);
  let delivered = 0;
  for (const workspace of new Set(reminders.map((r) => r.workspace_id))) {
    const pending = reminders.filter((r) => r.workspace_id === workspace);
    const { data, error } = await db
      .from("push_subscriptions")
      .select("*")
      .eq("workspace_id", workspace);
    if (error) continue;
    let success = false;
    for (const row of data ?? []) {
      const parsed = subscriptionRow.safeParse(row);
      if (!parsed.success) continue;
      const sub = parsed.data;
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          safePushPayload,
          { TTL: 3600, timeout: 10000 },
        );
        success = true;
      } catch (e) {
        const status = z.object({ statusCode: z.number() }).safeParse(e);
        if (status.success && [404, 410].includes(status.data.statusCode))
          await db.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
    const ids = pending.map((r) => r.id);
    if (success) {
      const { error: finish } = await db
        .from("reminders")
        .update({ sent_at: new Date().toISOString() })
        .in("id", ids)
        .is("sent_at", null);
      if (!finish) delivered += ids.length;
    } else
      await db.from("reminders").update({ claimed_at: null }).in("id", ids);
  }
  return { claimed: reminders.length, delivered };
}

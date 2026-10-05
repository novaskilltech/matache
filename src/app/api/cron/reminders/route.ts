import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { deliverReminders } from "@/lib/services/push-delivery";
export const maxDuration = 120;
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("authorization") ?? "";
  const expected = Buffer.from("Bearer " + secret),
    actual = Buffer.from(provided);
  if (
    !secret ||
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await deliverReminders(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Reminder delivery unavailable" },
      { status: 503 },
    );
  }
}

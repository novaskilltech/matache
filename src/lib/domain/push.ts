import { z } from "zod";
export function allowedPushEndpoint(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      [
        "fcm.googleapis.com",
        "updates.push.services.mozilla.com",
        "web.push.apple.com",
      ].includes(url.hostname)
    );
  } catch {
    return false;
  }
}
export const subscriptionSchema = z.object({
  endpoint: z
    .string()
    .url()
    .max(4096)
    .refine(allowedPushEndpoint, "Unsupported push endpoint"),
  keys: z.object({
    p256dh: z
      .string()
      .regex(/^[A-Za-z0-9_-]+={0,2}$/)
      .min(80)
      .max(128),
    auth: z
      .string()
      .regex(/^[A-Za-z0-9_-]+={0,2}$/)
      .min(20)
      .max(32),
  }),
});
export const safePushPayload = JSON.stringify({
  title: "MaTache",
  body: "Une action attend votre attention.",
  url: "/actions",
});

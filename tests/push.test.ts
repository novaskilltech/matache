import { it, expect } from "vitest";
import {
  allowedPushEndpoint,
  safePushPayload,
  subscriptionSchema,
} from "@/lib/domain/push";
it("prevents SSRF from arbitrary subscription endpoints", () => {
  expect(allowedPushEndpoint("https://fcm.googleapis.com/fcm/send/token")).toBe(
    true,
  );
  expect(allowedPushEndpoint("http://127.0.0.1/private")).toBe(false);
  expect(
    allowedPushEndpoint("https://fcm.googleapis.com.attacker.com/push"),
  ).toBe(false);
  expect(allowedPushEndpoint("https://user:pass@fcm.googleapis.com/push")).toBe(
    false,
  );
  expect(allowedPushEndpoint("https://169.254.169.254/")).toBe(false);
});
it("push content contains no client data", () => {
  expect(JSON.parse(safePushPayload)).toEqual({
    title: "MaTache",
    body: "Une action attend votre attention.",
    url: "/actions",
  });
  expect(
    subscriptionSchema.safeParse({
      endpoint: "https://fcm.googleapis.com/push",
      keys: { auth: "x", p256dh: "x" },
    }).success,
  ).toBe(false);
});

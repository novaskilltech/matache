import { it, expect, vi } from "vitest";
vi.mock("@/lib/services/push-delivery", () => ({ deliverReminders: vi.fn() }));
import { GET } from "@/app/api/cron/reminders/route";
it("cron rejects missing, incorrect and multibyte secrets without throwing", async () => {
  process.env.CRON_SECRET = "secret";
  for (const auth of ["", "Bearer wrong!", "Bearer sécret"]) {
    const response = await GET(
      new Request("https://example.com/api/cron/reminders", {
        headers: { authorization: auth },
      }),
    );
    expect(response.status).toBe(401);
  }
  delete process.env.CRON_SECRET;
});

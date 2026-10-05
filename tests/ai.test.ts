import { it, expect } from "vitest";
import {
  analysisResultSchema,
  manualResult,
  mapAnalysis,
} from "@/lib/ai/schema";
import { OpenAIProvider, SYSTEM_PROMPT } from "@/lib/ai/provider";
const id = "30000000-0000-4000-8000-000000000001";
it.each([
  ["Pouvez-vous m’envoyer la facture ?", "INVOICE", "TODO"],
  ["C’est possible de vous appeler ?", "CALLBACK", "TODO"],
  ["Nous voulons partir de Bruxelles du 13 au 23 octobre", "OMRA_INFO", "TODO"],
  ["Je vous envoie mes passeports demain", "WAITING_CLIENT", "WAITING"],
] as const)("contract fixture: %s", async (text, category, status) => {
  const result = manualResult(category);
  result.request.summary = text;
  if (category === "OMRA_INFO") {
    result.travel.departure_city = "Bruxelles";
    result.travel.start_date = "2026-10-13";
    result.travel.end_date = "2026-10-23";
    result.warnings = ["Année 2026 confirmée dans le contexte du dossier."];
  }
  const send: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: { content: JSON.stringify(result) },
            finish_reason: "stop",
          },
        ],
      }),
      { status: 200 },
    );
  const provider = new OpenAIProvider("test-key", "test-model", send);
  const output = await provider.analyze(
    [{ attachmentId: id, mimeType: "image/png", base64: "test" }],
    "2026-10-05T10:00:00Z",
  );
  expect(output.action.category).toBe(category);
  expect(output.action.status).toBe(status);
  if (category === "OMRA_INFO") {
    expect(output.travel.departure_city).toBe("Bruxelles");
    expect(output.travel.start_date).toBe("2026-10-13");
  }
});
it("validates enum, confidence and nulls without inventing fields", () => {
  const base = manualResult();
  expect(
    analysisResultSchema.safeParse({
      ...base,
      action: { ...base.action, category: "VISA" },
    }).success,
  ).toBe(false);
  expect(
    analysisResultSchema.safeParse({
      ...base,
      confidence: { ...base.confidence, action: 2 },
    }).success,
  ).toBe(false);
  expect(base.financial.total_amount).toBeNull();
  expect(
    mapAnalysis({
      ...base,
      client: { ...base.client, phone_normalized: "+33111111111" },
    }).client.phone_normalized,
  ).toBeNull();
});
it("chronology and untrusted screenshot guard are mandatory", () => {
  expect(SYSTEM_PROMPT).toContain("later a call");
  expect(SYSTEM_PROMPT).toContain("UNTRUSTED DATA");
  expect(SYSTEM_PROMPT).toContain("contradictions");
});
it("rejects unavailable, truncated or invalid AI instead of losing uploads", async () => {
  const provider = new OpenAIProvider(
    "x",
    "y",
    async () => new Response("", { status: 503 }),
  );
  await expect(provider.analyze([], "now")).rejects.toThrow("AI_UNAVAILABLE");
  const malformed = new OpenAIProvider(
    "x",
    "y",
    async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "{}" }, finish_reason: "stop" }],
        }),
      ),
  );
  await expect(malformed.analyze([], "now")).rejects.toThrow();
});

it("transmits all images together and rejects invented source UUIDs", async () => {
  let requestBody: Record<string, unknown> | undefined;
  const result = manualResult("CALLBACK");
  result.evidence = [
    {
      field_path: "action.title",
      attachment_ids: ["ffffffff-ffff-4fff-8fff-ffffffffffff"],
    },
  ];
  const send: typeof fetch = async (_url, init) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({
        choices: [
          {
            message: { content: JSON.stringify(result) },
            finish_reason: "stop",
          },
        ],
      }),
    );
  };
  const provider = new OpenAIProvider("x", "y", send);
  await expect(
    provider.analyze(
      [
        { attachmentId: id, mimeType: "image/png", base64: "one" },
        {
          attachmentId: "30000000-0000-4000-8000-000000000002",
          mimeType: "image/png",
          base64: "two",
        },
      ],
      "2026-10-05T10:00:00Z",
    ),
  ).rejects.toThrow("AI_INVALID_SOURCE");
  expect(JSON.stringify(requestBody)).toContain("data:image/png;base64,one");
  expect(JSON.stringify(requestBody)).toContain("data:image/png;base64,two");
});

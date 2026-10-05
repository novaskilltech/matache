import { readFile } from "node:fs/promises";
import { OpenAIProvider } from "../src/lib/ai/provider";
const key = process.env.AI_API_KEY;
if (!key)
  throw new Error("AI_API_KEY required; no live evaluation was performed.");
const provider = new OpenAIProvider(
  key,
  process.env.AI_MODEL || "gpt-4.1-mini",
);
const cases = [
  ["invoice", "INVOICE"],
  ["callback", "CALLBACK"],
  ["omra", "OMRA_INFO"],
  ["waiting", "WAITING_CLIENT"],
  ["chronology", "CALLBACK"],
] as const;
let failures = 0;
for (const [name, category] of cases) {
  const image = await readFile(
    new URL("../tests/fixtures/" + name + ".png", import.meta.url),
  );
  const output = await provider.analyze(
    [
      {
        attachmentId: crypto.randomUUID(),
        mimeType: "image/png",
        base64: image.toString("base64"),
      },
    ],
    "2026-10-05T10:00:00Z",
  );
  const ok =
    output.action.category === category &&
    (category !== "WAITING_CLIENT" || output.action.status === "WAITING");
  if (!ok) failures++;
  console.log(
    `${ok ? "PASS" : "FAIL"} ${name}: ${output.action.category}/${output.action.status}`,
  );
}
if (failures) process.exitCode = 1;

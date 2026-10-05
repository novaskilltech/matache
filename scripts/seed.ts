import { createClient } from "@supabase/supabase-js";
import { manualResult } from "../src/lib/ai/schema";
if (process.env.DEVELOPMENT_SEED_ALLOWED !== "true")
  throw new Error(
    "Set DEVELOPMENT_SEED_ALLOWED=true for a development workspace only",
  );
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  email = process.env.DEVELOPMENT_SEED_EMAIL,
  password = process.env.DEVELOPMENT_SEED_PASSWORD;
if (!url || !key || !email || !password)
  throw new Error("Development user and Supabase variables required");
const db = createClient(url, key, { auth: { persistSession: false } });
const auth = await db.auth.signInWithPassword({ email, password });
if (auth.error) throw new Error("Development login failed");
const workspace = await db.rpc("bootstrap_workspace");
if (workspace.error) throw new Error("Workspace creation failed");
for (const [i, name] of [
  "Mme Benali",
  "M. Amrani",
  "Famille Haddad",
].entries()) {
  const result = manualResult(
    (["INVOICE", "CALLBACK", "WAITING_CLIENT"] as const)[i],
  );
  result.client.name = name;
  const id = crypto.randomUUID();
  const analysis = await db
    .from("analyses")
    .insert({ id, workspace_id: workspace.data });
  if (analysis.error) throw new Error("Seed import failed");
  const saved = await db.rpc("validate_dossier", {
    p_workspace: workspace.data,
    p_analysis: id,
    p_result: result,
    p_client: null,
  });
  if (saved.error) throw new Error("Seed failed");
}
await db.auth.signOut();
console.log("Three fictitious client dossiers created.");
